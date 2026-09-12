import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { canManageSecurity, canManageUsers, canModerate } from "../../src/modules/administration/permissions";
import { hashIpAddress, summarizeUserAgent } from "../../src/modules/security/service";

test("v0.4 migration is additive and creates Better Auth security tables", async () => {
  const db = await PGlite.create();
  try {
    for (const migration of [
      "20260909000000_baseline",
      "20260909010000_network_content_core",
      "20260910000000_community_realtime",
      "20260911000000_accounts_security_permissions",
    ]) {
      await db.exec(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    }

    for (const table of ["RateLimit", "TwoFactor", "SecurityEvent"]) {
      const result = await db.query<{ exists: boolean }>(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1) AS exists",
        [table],
      );
      assert.equal(result.rows[0]?.exists, true, table);
    }
    const column = await db.query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'twoFactorEnabled') AS exists",
    );
    assert.equal(column.rows[0]?.exists, true);
  } finally {
    await db.close();
  }
});

test("role helpers centralize the existing hierarchy", () => {
  assert.equal(canModerate("MOD"), true);
  assert.equal(canModerate("USER"), false);
  assert.equal(canManageUsers("ADMIN"), true);
  assert.equal(canManageUsers("MOD"), false);
  assert.equal(canManageSecurity("ADMIN"), true);
  assert.equal(canManageSecurity("USER"), false);
});

test("security activity reduces device data and never retains a raw IP", () => {
  assert.equal(
    summarizeUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit Chrome/120.0 Safari/537.36"),
    "Chrome on Windows",
  );
  const rawIp = "203.0.113.42";
  const digest = hashIpAddress(rawIp);
  assert.ok(digest);
  assert.notEqual(digest, rawIp);
  assert.match(digest, /^[a-f0-9]{24}$/);
});
