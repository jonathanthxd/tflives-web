import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  RATE_LIMIT_COUNTER_RETENTION_MS,
  RATE_LIMITS,
  rateLimitDecision,
  rateLimitKey,
} from "../../src/infrastructure/rate-limit/service";
import { sanitizeApplicationErrorMessage } from "../../src/modules/analytics/service";

const MIGRATIONS = [
  "20260909000000_baseline",
  "20260909010000_network_content_core",
  "20260910000000_community_realtime",
  "20260911000000_accounts_security_permissions",
  "20260912000000_profiles_identity",
  "20260913000000_progression_achievements",
  "20260914000000_obtainable_achievements",
  "20260915000000_team_member_identity",
  "20260915000000_tfl_economy",
  "20260916000000_cosmetics_premium",
  "20260917000000_creator_ecosystem",
  "20260918000000_analytics_observability",
  "20260921000000_production_hardening",
];

test("rate limit buckets stay bounded and windows are small", () => {
  for (const [bucket, window] of Object.entries(RATE_LIMITS)) {
    assert.ok(window.limit > 0, `${bucket} needs a positive limit`);
    assert.ok(window.windowSeconds > 0 && window.windowSeconds <= 15 * 60, `${bucket} window out of range`);
  }
  assert.equal(RATE_LIMITS["client-errors"].limit, 20);
  assert.equal(RATE_LIMITS.appeals.limit, 5);
});

test("rate limit keys are hashed and bucket-scoped", () => {
  const key = rateLimitKey("comments", "user-123");
  assert.match(key, /^[a-f0-9]{40}$/);
  assert.equal(key, rateLimitKey("comments", "user-123"));
  assert.notEqual(key, rateLimitKey("reactions", "user-123"));
  assert.notEqual(key, rateLimitKey("comments", "user-456"));
  assert.doesNotMatch(key, /user-123/);
});

test("rate limit decisions allow up to the limit, then ask for a retry", () => {
  const now = new Date("2026-09-18T12:00:00.000Z");
  const windowStartedAt = new Date("2026-09-18T11:59:30.000Z");
  const allowed = rateLimitDecision({ count: 5, limit: 5, windowSeconds: 60, windowStartedAt, now });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.remaining, 0);
  const blocked = rateLimitDecision({ count: 6, limit: 5, windowSeconds: 60, windowStartedAt, now });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 30);
});

test("hardening migration adds a defaulted error source and an atomic counter", async () => {
  const db = await PGlite.create();
  try {
    for (const migration of MIGRATIONS) await db.exec(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));

    await db.exec(`INSERT INTO "ApplicationError" (id,fingerprint,area,message) VALUES ('server-error','fp-server','chat:global','Server side');`);
    const defaults = await db.query<{ source: string }>(`SELECT source FROM "ApplicationError" WHERE id='server-error'`);
    assert.equal(defaults.rows[0].source, "server");

    await db.exec(`INSERT INTO "RateLimitCounter" ("key","count","windowStartedAt","updatedAt") VALUES ('k',1,now(),now())`);
    // Simulate the limiter upsert incrementing within the same window.
    await db.exec(`INSERT INTO "RateLimitCounter" ("key","count","windowStartedAt","updatedAt") VALUES ('k',1,now(),now())
      ON CONFLICT ("key") DO UPDATE SET "count" = "RateLimitCounter"."count" + 1, "updatedAt" = now()`);
    const bumped = await db.query<{ count: number }>(`SELECT count FROM "RateLimitCounter" WHERE key='k'`);
    assert.equal(bumped.rows[0].count, 2);

    // Past the window the same upsert resets the counter instead of growing it.
    await db.exec(`UPDATE "RateLimitCounter" SET "windowStartedAt" = now() - interval '10 minutes' WHERE key='k'`);
    await db.exec(`INSERT INTO "RateLimitCounter" ("key","count","windowStartedAt","updatedAt") VALUES ('k',1,now(),now())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimitCounter"."windowStartedAt" < now() - interval '60 seconds' THEN 1 ELSE "RateLimitCounter"."count" + 1 END,
        "windowStartedAt" = CASE WHEN "RateLimitCounter"."windowStartedAt" < now() - interval '60 seconds' THEN now() ELSE "RateLimitCounter"."windowStartedAt" END`);
    const reset = await db.query<{ count: number }>(`SELECT count FROM "RateLimitCounter" WHERE key='k'`);
    assert.equal(reset.rows[0].count, 1);
  } finally {
    await db.close();
  }
});

test("expired rate-limit counters are purged after the retention window", async () => {
  assert.equal(RATE_LIMIT_COUNTER_RETENTION_MS, 24 * 60 * 60 * 1000);

  const db = await PGlite.create();
  try {
    for (const migration of MIGRATIONS) await db.exec(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    await db.exec(`INSERT INTO "RateLimitCounter" ("key","count","windowStartedAt","updatedAt") VALUES
      ('fresh',1,now(),now()),
      ('stale',1,now() - interval '25 hours', now() - interval '25 hours')`);

    // Same housekeeping predicate the limiter runs: drop counters idle past retention.
    await db.exec(`DELETE FROM "RateLimitCounter" WHERE "updatedAt" < now() - interval '24 hours'`);
    const remaining = await db.query<{ key: string }>(`SELECT key FROM "RateLimitCounter" ORDER BY key`);
    assert.deepEqual(remaining.rows.map((row) => row.key), ["fresh"]);
  } finally {
    await db.close();
  }

  const service = readFileSync("src/infrastructure/rate-limit/service.ts", "utf8");
  assert.match(service, /RATE_LIMIT_COUNTER_RETENTION_MS/);
  assert.match(service, /rateLimitCounter\.deleteMany/);
});

test("client errors are sanitized before storage", () => {
  const sanitized = sanitizeApplicationErrorMessage(
    "Boom token=abc123 at https://example.test/x?session=zzz for jane@example.test",
  );
  assert.doesNotMatch(sanitized, /abc123|example\.test|x\?session|jane@/);
});

test("client error pipeline and rate limiting are wired into the routes", () => {
  const route = readFileSync("src/app/api/observability/client-error/route.ts", "utf8");
  assert.match(route, /enforceRateLimit\("client-errors"/);
  assert.match(route, /source: "client"/);
  assert.match(route, /sanitizeApplicationErrorMessage/);

  const instrumentation = readFileSync("src/instrumentation-client.ts", "utf8");
  assert.match(instrumentation, /unhandledrejection/);
  assert.match(readFileSync("src/app/global-error.tsx", "utf8"), /sendClientError/);
  assert.match(readFileSync("src/shared/observability/client-error.ts", "utf8"), /sendBeacon/);
  assert.match(readFileSync("src/modules/analytics/service.ts", "utf8"), /source/);

  for (const file of [
    "src/app/api/community/report/route.ts",
    "src/app/api/messaging/report/route.ts",
    "src/app/api/chat/global/report/route.ts",
    "src/app/api/appeals/route.ts",
    "src/app/api/community/comments/route.ts",
    "src/app/api/community/reactions/route.ts",
    "src/app/api/chat/global/route.ts",
    "src/app/api/posts/route.ts",
    "src/app/api/messaging/conversations/[id]/route.ts",
    "src/app/api/social/follow/route.ts",
    "src/app/api/social/friends/route.ts",
  ]) {
    assert.match(readFileSync(file, "utf8"), /enforceRateLimit\(/, `${file} should be rate limited`);
  }
});
