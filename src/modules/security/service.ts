import { createHash } from "node:crypto";
import { SecurityEventType } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { createNotification } from "@/modules/notifications/service";

interface RecordSecurityEventInput {
  userId?: string | null;
  event: SecurityEventType;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, string | number | boolean>;
}

const NOTIFIABLE_EVENTS = new Set<SecurityEventType>([
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "OAUTH_LINKED",
  "OAUTH_UNLINKED",
  "OTHER_SESSIONS_REVOKED",
  "TWO_FACTOR_ENABLED",
  "TWO_FACTOR_DISABLED",
]);

/** A compact label is useful to people while avoiding storage of the raw UA. */
export function summarizeUserAgent(userAgent?: string | null): string | null {
  if (!userAgent) return null;

  const browser = /edg\//i.test(userAgent)
    ? "Edge"
    : /firefox\//i.test(userAgent)
      ? "Firefox"
      : /chrome\//i.test(userAgent) && !/chromium/i.test(userAgent)
        ? "Chrome"
        : /safari\//i.test(userAgent) && !/chrome|chromium|android/i.test(userAgent)
          ? "Safari"
          : "Browser";
  const device = /iphone/i.test(userAgent)
    ? "iPhone"
    : /ipad/i.test(userAgent)
      ? "iPad"
      : /android/i.test(userAgent)
        ? "Android"
        : /windows/i.test(userAgent)
          ? "Windows"
          : /mac os|macintosh/i.test(userAgent)
            ? "Mac"
            : /linux/i.test(userAgent)
              ? "Linux"
              : "Unknown device";

  return `${browser} on ${device}`;
}

/** Store a keyed, truncated digest instead of a raw IP address. */
export function hashIpAddress(ipAddress?: string | null): string | null {
  if (!ipAddress) return null;
  const secret = process.env.BETTER_AUTH_SECRET ?? "tflives-security-event";
  return createHash("sha256").update(`${secret}:${ipAddress}`).digest("hex").slice(0, 24);
}

/**
 * Security telemetry is best-effort: an auxiliary event or notification must
 * never make a login, password change, or session revocation unavailable.
 */
export async function recordSecurityEvent({
  userId,
  event,
  ipAddress,
  userAgent,
  metadata,
}: RecordSecurityEventInput) {
  try {
    const securityEvent = await prisma.securityEvent.create({
      data: {
        userId: userId ?? null,
        event,
        ipHash: hashIpAddress(ipAddress),
        userAgent: summarizeUserAgent(userAgent),
        metadata,
      },
    });

    if (userId && NOTIFIABLE_EVENTS.has(event)) {
      await createNotification({
        userId,
        type: "SECURITY_ALERT",
        entityType: "SecurityEvent",
        entityId: securityEvent.id,
      });
    }

    return securityEvent;
  } catch {
    console.error("[security] Unable to persist a security event.");
    return null;
  }
}
