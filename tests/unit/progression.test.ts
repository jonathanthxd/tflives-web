import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PROGRESSION_ACHIEVEMENTS, PRODUCTION_ACHIEVEMENT_COUNT } from "../../src/modules/progression/catalog";
import { getProgressSummary, levelForXp, xpRequiredForLevel } from "../../src/modules/progression/level";
import { achievementCodesForFacts, activityAwardAllowed } from "../../src/modules/progression/service";
import { describeAchievementTrigger, normalizedTriggerValue } from "../../src/modules/achievements/triggers";

test("level formula has stable boundaries and a bounded progress summary", () => {
  assert.equal(xpRequiredForLevel(1), 0);
  assert.equal(xpRequiredForLevel(2), 100);
  assert.equal(xpRequiredForLevel(5), 1600);
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(99), 1);
  assert.equal(levelForXp(100), 2);
  assert.equal(levelForXp(1600), 5);

  assert.deepEqual(getProgressSummary({ xp: 100, level: 99 }, 2), {
    level: 2,
    xp: 100,
    currentLevelXp: 100,
    nextLevelXp: 400,
    progressPercent: 0,
    achievementCount: 2,
  });
});

test("activity XP caps and cooldowns are enforced from server-owned rules", () => {
  const config = { xp: 5, dailyCap: 10, cooldownMs: 60_000 };
  const now = new Date("2026-09-13T12:00:00.000Z");
  assert.equal(activityAwardAllowed({ config, now, awardedToday: 9, mostRecentAwardAt: new Date(now.getTime() - 60_000) }), true);
  assert.equal(activityAwardAllowed({ config, now, awardedToday: 10, mostRecentAwardAt: null }), false);
  assert.equal(activityAwardAllowed({ config, now, awardedToday: 0, mostRecentAwardAt: new Date(now.getTime() - 59_999) }), false);
});

test("achievement rules unlock only real thresholds and level rewards cannot duplicate them", () => {
  const none = achievementCodesForFacts({
    profileComplete: false, emailVerified: false, oauthConnections: 0,
    globalMessages: 0, directMessages: 0, friendships: 0, level: 1, xp: 0,
  });
  assert.deepEqual(none, []);

  const milestones = achievementCodesForFacts({
    profileComplete: true, emailVerified: true, oauthConnections: 1,
    globalMessages: 10, directMessages: 10, friendships: 5, level: 10, xp: 2_000,
  });
  assert.equal(new Set(milestones).size, milestones.length);
  assert.ok(milestones.includes("PROFILE_COMPLETE"));
  assert.ok(milestones.includes("LEVEL_FIVE"));
  assert.ok(milestones.includes("LEVEL_TEN"));
  assert.ok(milestones.includes("XP_01_1"));
});


test("pre-existing OAuth links qualify from current server facts without replaying the link event", () => {
  const linked = achievementCodesForFacts({
    profileComplete: false, emailVerified: false, oauthConnections: 2,
    globalMessages: 0, directMessages: 0, friendships: 0, level: 1, xp: 0,
  });
  assert.ok(linked.includes("OAUTH_CONNECTED"));
  assert.ok(linked.includes("IDENTITY_DUAL_LINK"));
});

test("achievement API reconciles fixed and admin automatic achievements before returning the profile", () => {
  const route = readFileSync("src/app/api/achievements/user/route.ts", "utf8");
  assert.match(route, /reconcileProgressionAchievements\(target\.id\)/);
  assert.match(route, /evaluateAutomaticAchievements\(target\.id, ACHIEVEMENT_TRIGGER_KEYS\)/);
});


test("production progression catalogue contains exactly 200 new durable milestones", () => {
  assert.equal(PRODUCTION_ACHIEVEMENT_COUNT, 200);
  assert.equal(PROGRESSION_ACHIEVEMENTS.length, 211);
  assert.equal(new Set(PROGRESSION_ACHIEVEMENTS.map((achievement) => achievement.code)).size, 211);
  const production = PROGRESSION_ACHIEVEMENTS.slice(11);
  assert.ok(production.every((achievement) => achievement.xpReward === 0));
  assert.ok(production.every((achievement) => achievement.requirements.length > 0));
  assert.ok(production.every((achievement) => achievement.copy.es.title && achievement.copy.en.title));
});

test("v0.6 migration creates isolated progression data with idempotency keys", async () => {
  const db = await PGlite.create();
  try {
    for (const migration of [
      "20260909000000_baseline",
      "20260909010000_network_content_core",
      "20260910000000_community_realtime",
      "20260911000000_accounts_security_permissions",
      "20260912000000_profiles_identity",
      "20260913000000_progression_achievements",
      "20260914000000_obtainable_achievements",
    ]) {
      await db.exec(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    }
    await db.exec(`INSERT INTO "User" (id,email,name,"updatedAt") VALUES ('progress-user','progress@example.test','Progress User',now())`);
    await db.exec(`INSERT INTO "UserProgress" ("userId","updatedAt") VALUES ('progress-user',now())`);
    const progress = await db.query<{ xp: number; level: number }>(`SELECT xp, level FROM "UserProgress" WHERE "userId" = 'progress-user'`);
    assert.deepEqual(progress.rows[0], { xp: 0, level: 1 });

    await db.exec(`INSERT INTO "ProgressEvent" (id,"userId",source,"sourceKey",xp) VALUES ('event-1','progress-user','GLOBAL_MESSAGE','global-message:one',5)`);
    await assert.rejects(db.exec(`INSERT INTO "ProgressEvent" (id,"userId",source,"sourceKey",xp) VALUES ('event-2','progress-user','GLOBAL_MESSAGE','global-message:one',5)`));
    await db.exec(`INSERT INTO "UserProgressAchievement" (id,"userId",code) VALUES ('unlock-1','progress-user','FIRST_GLOBAL_MESSAGE')`);
    await assert.rejects(db.exec(`INSERT INTO "UserProgressAchievement" (id,"userId",code) VALUES ('unlock-2','progress-user','FIRST_GLOBAL_MESSAGE')`));
  } finally {
    await db.close();
  }
});


test("admin achievement trigger rules stay human-readable and validate goals", () => {
  assert.equal(normalizedTriggerValue("GLOBAL_MESSAGES", 100), 100);
  assert.equal(normalizedTriggerValue("GLOBAL_MESSAGES", 0), null);
  assert.equal(normalizedTriggerValue("PROFILE_COMPLETE", 999), 1);
  assert.equal(
    describeAchievementTrigger("GLOBAL_MESSAGES", 100),
    "Se desbloquea automáticamente al alcanzar 100 mensajes en el chat global.",
  );
});
