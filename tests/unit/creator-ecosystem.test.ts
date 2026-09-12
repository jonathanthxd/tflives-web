import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { canAccessSection } from "../../src/modules/administration/permissions";
import {
  creatorApplicationSchema,
  creatorProfileUpdateSchema,
  isSafeCreatorUrl,
} from "../../src/modules/creators/validation";

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
];

test("creator URL validation only accepts HTTPS and the selected platform allowlist", () => {
  assert.equal(isSafeCreatorUrl("TWITCH", "https://www.twitch.tv/tflives"), true);
  assert.equal(isSafeCreatorUrl("YOUTUBE", "https://example.test/channel"), false);
  assert.equal(isSafeCreatorUrl("EXTERNAL", "https://creator.example/about"), true);
  assert.equal(isSafeCreatorUrl("EXTERNAL", "javascript:alert(1)"), false);
  assert.equal(creatorApplicationSchema.safeParse({ primaryPlatform: "KICK", channelUrl: "https://kick.com/tflives", category: "VARIETY", description: "A concise public description", motivation: "I create welcoming streams" }).success, true);
  assert.equal(creatorApplicationSchema.safeParse({ primaryPlatform: "TWITCH", channelUrl: "https://example.test/not-twitch", category: "VARIETY", description: "Description", motivation: "Motivation" }).success, false);
  assert.equal(creatorProfileUpdateSchema.safeParse({ description: "<script>bad</script>" }).success, false);
  assert.equal(creatorProfileUpdateSchema.safeParse({ userId: "another-user" }).success, false);
});

test("creator management is ADMIN-only and does not change the role hierarchy", () => {
  assert.equal(canAccessSection("USER", "creators"), false);
  assert.equal(canAccessSection("MOD", "creators"), false);
  assert.equal(canAccessSection("ADMIN", "creators"), true);
  assert.equal(canAccessSection("MOD", "reports"), true);
});

test("v0.9 migration is additive, ties creators to users, and permits one pending application", async () => {
  const db = await PGlite.create();
  try {
    for (const migration of MIGRATIONS) await db.exec(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    await db.exec(`INSERT INTO "User" (id,email,name,"updatedAt") VALUES ('creator-user','creator@example.test','Creator',now());`);
    await db.exec(readFileSync("prisma/migrations/20260917000000_creator_ecosystem/migration.sql", "utf8"));
    await db.exec(`INSERT INTO "CreatorProfile" (id,"userId",category,description,"updatedAt") VALUES ('creator-profile','creator-user','MINECRAFT','Public creator description',now());
      INSERT INTO "CreatorPlatform" (id,"creatorId",type,url,"updatedAt") VALUES ('creator-platform','creator-profile','TWITCH','https://twitch.tv/creator',now());
      INSERT INTO "CreatorApplication" (id,"userId","primaryPlatform","channelUrl",category,description,motivation,"updatedAt") VALUES ('pending-one','creator-user','TWITCH','https://twitch.tv/creator','MINECRAFT','Description','Motivation',now());`);
    await assert.rejects(db.exec(`INSERT INTO "CreatorApplication" (id,"userId","primaryPlatform","channelUrl",category,description,motivation,"updatedAt") VALUES ('pending-two','creator-user','TWITCH','https://twitch.tv/creator2','MINECRAFT','Description','Motivation',now());`));
    await db.exec(`UPDATE "CreatorApplication" SET status = 'REJECTED' WHERE id = 'pending-one';
      INSERT INTO "CreatorApplication" (id,"userId","primaryPlatform","channelUrl",category,description,motivation,"updatedAt") VALUES ('pending-three','creator-user','TWITCH','https://twitch.tv/creator3','MINECRAFT','Description','Motivation',now());`);
    assert.equal((await db.query(`SELECT "userId" FROM "CreatorProfile" WHERE id = 'creator-profile'`)).rows[0]?.userId, "creator-user");
  } finally { await db.close(); }
});

test("creator public surfaces reuse the existing user social controls", () => {
  const detail = readFileSync("src/app/[locale]/(marketing)/streamers/[username]/page.tsx", "utf8");
  const socialCard = readFileSync("src/modules/social/components/social-card.tsx", "utf8");
  assert.match(detail, /SocialCard username=\{creator\.username\}/);
  assert.match(socialCard, /\/api\/social\/follow/);
  assert.match(socialCard, /\/api\/profile\/like/);
  assert.equal(readFileSync("prisma/schema.prisma", "utf8").includes("CreatorFollower"), false);
});
