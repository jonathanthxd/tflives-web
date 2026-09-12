import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { usernameSchema } from "../../src/modules/authentication/validation";
import { ProfileMediaError, validateProfileImage } from "../../src/modules/profiles/media";
import { ProfileAssetKind } from "@prisma/client";
import { parseSocialLinks } from "../../src/modules/profiles/types";
import { profileUpdateSchema } from "../../src/modules/profiles/validation";

test("usernames normalize safely and reserve application routes", () => {
  assert.equal(usernameSchema.parse("  Community_User  "), "community_user");
  assert.equal(usernameSchema.safeParse("admin").success, false);
  assert.equal(usernameSchema.safeParse("not-valid").success, false);
});

test("profile updates only accept public identity fields and safe social links", () => {
  const valid = profileUpdateSchema.safeParse({
    displayName: "  Community member ",
    bio: "A short public bio.",
    socialLinks: [
      { platform: "website", url: "https://example.test/member" },
      { platform: "github", url: "https://github.com/member" },
    ],
  });
  assert.equal(valid.success, true);
  if (valid.success) assert.equal(valid.data.displayName, "Community member");

  assert.equal(profileUpdateSchema.safeParse({ role: "ADMIN" }).success, false);
  assert.equal(profileUpdateSchema.safeParse({ email: "private@example.test" }).success, false);
  assert.equal(profileUpdateSchema.safeParse({ bio: "<strong>not plain text</strong>" }).success, false);
  assert.equal(profileUpdateSchema.safeParse({ socialLinks: [{ platform: "website", url: "javascript:alert(1)" }] }).success, false);
  assert.equal(profileUpdateSchema.safeParse({ socialLinks: [{ platform: "github", url: "https://example.test/member" }] }).success, false);
  assert.equal(profileUpdateSchema.safeParse({ bio: "x".repeat(241) }).success, false);
});

test("legacy social data is filtered before it reaches public profile links", () => {
  assert.deepEqual(
    parseSocialLinks([
      { platform: "website", url: "https://example.test" },
      { platform: "website", url: "https://other.test" },
      { platform: "github", url: "javascript:alert(1)" },
    ]),
    [{ platform: "website", url: "https://example.test" }],
  );
});

test("profile identity UI stays complete in Spanish and English", () => {
  const es = JSON.parse(readFileSync("messages/es.json", "utf8"));
  const en = JSON.parse(readFileSync("messages/en.json", "utf8"));
  for (const namespace of ["Profile", "ProfileSettings", "ProfilePlaceholders"] as const) {
    assert.deepEqual(Object.keys(es[namespace]).sort(), Object.keys(en[namespace]).sort(), namespace);
  }
});

test("profile assets require matching image bytes and reasonable dimensions", () => {
  const png = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png, 0);
  png.writeUInt32BE(512, 16);
  png.writeUInt32BE(512, 20);
  assert.equal(validateProfileImage(png, "image/png", ProfileAssetKind.AVATAR).width, 512);
  assert.throws(
    () => validateProfileImage(png, "image/jpeg", ProfileAssetKind.AVATAR),
    ProfileMediaError,
  );
  png.writeUInt32BE(4097, 16);
  assert.throws(
    () => validateProfileImage(png, "image/png", ProfileAssetKind.AVATAR),
    ProfileMediaError,
  );
});

test("v0.5 migration adds username change tracking and case-insensitive uniqueness", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(readFileSync("prisma/migrations/20260909000000_baseline/migration.sql", "utf8"));
    await db.exec(readFileSync("prisma/migrations/20260912000000_profiles_identity/migration.sql", "utf8"));
    const column = await db.query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'username_changed_at') AS exists",
    );
    assert.equal(column.rows[0]?.exists, true);
    await db.exec(`INSERT INTO "User" (id,email,name,username,"updatedAt") VALUES ('profile-a','profile-a@example.test','Profile A','profile_a',now())`);
    await db.exec(`INSERT INTO "UsernameAlias" (username,"userId") VALUES ('profile_old','profile-a')`);
    assert.equal((await db.query(`SELECT "userId" FROM "UsernameAlias" WHERE username = 'profile_old'`)).rows.length, 1);
    await assert.rejects(
      db.exec(`INSERT INTO "User" (id,email,name,username,"updatedAt") VALUES ('profile-b','profile-b@example.test','Profile B','PROFILE_A',now())`),
    );
  } finally {
    await db.close();
  }
});
