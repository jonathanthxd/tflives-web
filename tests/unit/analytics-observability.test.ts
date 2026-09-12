import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  ANALYTICS_EVENT_TYPES,
  analyticsRange,
  applicationErrorFingerprint,
  comparison,
  isAnalyticsRange,
  isSignificantAnalyticsEvent,
  sanitizeApplicationErrorMessage,
} from "../../src/modules/analytics/service";

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
];

test("analytics accepts only the small allowlist and activity windows are bounded", () => {
  assert.deepEqual(ANALYTICS_EVENT_TYPES, ["PROFILE_COMPLETED", "COSMETIC_EQUIPPED"]);
  assert.equal(isSignificantAnalyticsEvent("PROFILE_COMPLETED"), true);
  assert.equal(isSignificantAnalyticsEvent("COSMETIC_EQUIPPED"), true);
  assert.equal(isAnalyticsRange("7d"), true);
  assert.equal(isAnalyticsRange("today"), false);
  const period = analyticsRange("7d", new Date("2026-09-12T12:00:00.000Z"));
  assert.equal(period.days, 7);
  assert.equal(period.start.toISOString(), "2026-09-05T12:00:00.000Z");
  assert.deepEqual(comparison(5, 0), { value: 5, previous: 0, delta: 5, percent: null });
});

test("error summaries remove direct identifiers and fingerprint repeated technical failures", () => {
  const sanitized = sanitizeApplicationErrorMessage("Password token=secret-value failed for jane@example.test at https://example.test/callback?token=abc");
  assert.doesNotMatch(sanitized, /secret-value|jane@example|example\.test\/callback/);
  assert.match(sanitized, /\[redacted\]|\[email\]|\[url\]/);
  assert.equal(
    applicationErrorFingerprint("cosmetics:purchase", new Error("Database unavailable")),
    applicationErrorFingerprint("cosmetics:purchase", new Error("Database unavailable")),
  );
});

test("analytics event source keys and error fingerprints aggregate duplicate retries", async () => {
  const db = await PGlite.create();
  try {
    for (const migration of MIGRATIONS) await db.exec(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    await db.exec(`INSERT INTO "User" (id,email,name,"updatedAt") VALUES ('analytics-user','analytics@example.test','Analytics User',now());
      INSERT INTO "AnalyticsEvent" (id,type,"userId","sourceKey") VALUES ('event-one','PROFILE_COMPLETED','analytics-user','profile-completed:analytics-user');
      INSERT INTO "ApplicationError" (id,fingerprint,area,message) VALUES ('error-one','fingerprint-one','chat:global','Safe message');`);
    await assert.rejects(db.exec(`INSERT INTO "AnalyticsEvent" (id,type,"sourceKey") VALUES ('event-two','PROFILE_COMPLETED','profile-completed:analytics-user')`));
    await assert.rejects(db.exec(`INSERT INTO "ApplicationError" (id,fingerprint,area,message) VALUES ('error-two','fingerprint-one','chat:global','Safe message')`));
  } finally {
    await db.close();
  }
});

test("analytics endpoints are admin-guarded and do not expose raw message content", () => {
  const analyticsRoute = readFileSync("src/app/api/admin/analytics/route.ts", "utf8");
  const errorsRoute = readFileSync("src/app/api/admin/observability/errors/route.ts", "utf8");
  const service = readFileSync("src/modules/analytics/service.ts", "utf8");
  assert.match(analyticsRoute, /requireAdminSection\("analytics"\)/);
  assert.match(errorsRoute, /requireAdminSection\("analytics"\)/);
  assert.doesNotMatch(service, /GlobalChatMessage\.content|DirectMessage\.content/);
});
