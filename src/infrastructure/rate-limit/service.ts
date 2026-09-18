import { createHash, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

/**
 * Fixed-window, DB-backed rate limiter. Used per-route on the write-heavy and
 * report/error endpoints that Better Auth does not protect. Keys are hashed so
 * no raw IPs or account identifiers are persisted in the counter table.
 *
 * The limiter fails open: a database hiccup must never take down a route.
 */

export type RateLimitWindow = {
  limit: number;
  windowSeconds: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/** Central limits for the endpoints the app opts into. Tests assert these. */
export const RATE_LIMITS = {
  "client-errors": { limit: 20, windowSeconds: 5 * 60 },
  "community-report": { limit: 10, windowSeconds: 60 },
  "messaging-report": { limit: 10, windowSeconds: 60 },
  "chat-report": { limit: 10, windowSeconds: 60 },
  appeals: { limit: 5, windowSeconds: 60 },
  comments: { limit: 60, windowSeconds: 60 },
  reactions: { limit: 60, windowSeconds: 60 },
  "chat-global": { limit: 60, windowSeconds: 60 },
  posts: { limit: 30, windowSeconds: 60 },
  "messaging-send": { limit: 120, windowSeconds: 60 },
  "social-follow": { limit: 60, windowSeconds: 60 },
  "social-friends": { limit: 60, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitWindow>;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

/** Hash a bucket + identity so no raw identifiers land in the counter table. */
export function rateLimitKey(bucket: RateLimitBucket, identity: string) {
  const secret = process.env.BETTER_AUTH_SECRET ?? "tflives-rate-limit";
  return createHash("sha256").update(`${secret}:${bucket}:${identity}`).digest("hex").slice(0, 40);
}

/** Pure decision helper, kept separate for cheap unit tests. */
export function rateLimitDecision({
  count,
  limit,
  windowSeconds,
  windowStartedAt,
  now = new Date(),
}: {
  count: number;
  limit: number;
  windowSeconds: number;
  windowStartedAt: Date;
  now?: Date;
}): RateLimitDecision {
  const windowEnd = new Date(windowStartedAt.getTime() + windowSeconds * 1000);
  const remaining = Math.max(0, limit - count);
  return {
    allowed: count <= limit,
    remaining,
    retryAfterSeconds: Math.max(0, Math.ceil((windowEnd.getTime() - now.getTime()) / 1000)),
  };
}

/**
 * Consume one unit from `bucket` for `identity` (an arbitrary string such as a
 * hashed IP or a userId). Resets the window automatically once it expires.
 */
export async function consumeRateLimit(
  bucket: RateLimitBucket,
  identity: string,
  now = new Date(),
): Promise<RateLimitDecision> {
  const { limit, windowSeconds } = RATE_LIMITS[bucket];
  const key = rateLimitKey(bucket, identity);
  const cutoff = new Date(now.getTime() - windowSeconds * 1000);
  try {
    const rows = await prisma.$queryRaw<Array<{ count: number; windowStartedAt: Date }>>(Prisma.sql`
      INSERT INTO "RateLimitCounter" ("key", "count", "windowStartedAt", "updatedAt")
      VALUES (${key}, 1, ${now}, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitCounter"."windowStartedAt" < ${cutoff} THEN 1
          ELSE "RateLimitCounter"."count" + 1
        END,
        "windowStartedAt" = CASE
          WHEN "RateLimitCounter"."windowStartedAt" < ${cutoff} THEN ${now}
          ELSE "RateLimitCounter"."windowStartedAt"
        END,
        "updatedAt" = ${now}
      RETURNING "count", "windowStartedAt"
    `);
    const row = rows[0];
    if (!row) return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
    maybePurgeExpiredCounters(now);
    return rateLimitDecision({
      count: row.count,
      limit,
      windowSeconds,
      windowStartedAt: row.windowStartedAt,
      now,
    });
  } catch {
    console.error("[rate-limit] Unable to enforce limit; allowing request.");
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/** Counters idle for longer than this are safe to drop: no window exceeds it. */
export const RATE_LIMIT_COUNTER_RETENTION_MS = 24 * 60 * 60 * 1000;

/** Keep the counter table bounded without paying for a periodic job. */
async function maybePurgeExpiredCounters(now: Date) {
  if (randomInt(1, 256) !== 1) return;
  try {
    await prisma.rateLimitCounter.deleteMany({
      where: { updatedAt: { lt: new Date(now.getTime() - RATE_LIMIT_COUNTER_RETENTION_MS) } },
    });
  } catch {
    /* Best-effort housekeeping only. */
  }
}

/**
 * Middleware-style guard for route handlers: returns a 429 NextResponse when
 * the limit is exceeded, or null to let the request continue.
 */
export async function enforceRateLimit(
  bucket: RateLimitBucket,
  identity: string,
  now = new Date(),
): Promise<NextResponse | null> {
  const decision = await consumeRateLimit(bucket, identity, now);
  if (decision.allowed) return null;
  return NextResponse.json(
    { error: "Demasiadas solicitudes. Intentá de nuevo en un momento." },
    { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
  );
}