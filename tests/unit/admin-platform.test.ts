import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ADMIN_NAV_GROUPS, canAccessSection } from "../../src/modules/administration/permissions";
import { normalizeAdminSearchQuery } from "../../src/modules/administration/platform-service";

test("v0.10 navigation only exposes backed sections and still respects the server capability map", () => {
  const sections = ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.section));
  assert.equal(sections.includes("analytics"), false);
  assert.equal(sections.includes("dashboard"), true);
  assert.equal(sections.includes("staffLog"), true);
  assert.equal(canAccessSection("MOD", "dashboard"), true);
  assert.equal(canAccessSection("MOD", "reports"), true);
  assert.equal(canAccessSection("MOD", "users"), false);
  assert.equal(canAccessSection("ADMIN", "users"), true);
});

test("admin search is bounded before any database lookup", () => {
  assert.equal(normalizeAdminSearchQuery("  ab  "), "ab");
  assert.equal(normalizeAdminSearchQuery("x".repeat(100)).length, 80);
});

test("admin platform endpoints retain server-side guards and the user overview stays ADMIN-only", () => {
  const dashboard = readFileSync("src/app/api/admin/dashboard/route.ts", "utf8");
  const search = readFileSync("src/app/api/admin/search/route.ts", "utf8");
  const overview = readFileSync("src/app/api/admin/users/[id]/overview/route.ts", "utf8");
  assert.match(dashboard, /requireAdminSection\("dashboard"\)/);
  assert.match(search, /requireAdminSection\("dashboard"\)/);
  assert.match(overview, /requireAdminSection\("users"\)/);
});

test("new admin messages stay complete in Spanish and English", () => {
  const es = JSON.parse(readFileSync("messages/es.json", "utf8")).AdminPlatform;
  const en = JSON.parse(readFileSync("messages/en.json", "utf8")).AdminPlatform;
  assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort());
});
