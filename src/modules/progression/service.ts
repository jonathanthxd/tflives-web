import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import {
  PROGRESSION_ACHIEVEMENTS,
  PROGRESSION_ACHIEVEMENTS_BY_CODE,
  type ProgressionAchievementCode,
} from "@/modules/progression/catalog";
import { getProgressSummary, levelForXp, type PublicProgress } from "@/modules/progression/level";
import { isProfileComplete } from "@/modules/profiles/completion";
import { evaluateAutomaticAchievements } from "@/modules/achievements/automatic";
import { ACHIEVEMENT_TRIGGER_KEYS } from "@/modules/achievements/triggers";
import { awardAchievementCoins, awardLevelCoins } from "@/modules/economy/service";

type ProgressionSource =
  | "PROFILE_COMPLETE"
  | "EMAIL_VERIFIED"
  | "OAUTH_CONNECTED"
  | "GLOBAL_MESSAGE"
  | "DIRECT_MESSAGE"
  | "FRIENDSHIP";

interface XpSourceConfig {
  xp: number;
  dailyCap?: number;
  cooldownMs?: number;
}

const XP_SOURCES: Record<ProgressionSource, XpSourceConfig> = {
  PROFILE_COMPLETE: { xp: 40 },
  EMAIL_VERIFIED: { xp: 30 },
  OAUTH_CONNECTED: { xp: 25 },
  GLOBAL_MESSAGE: { xp: 5, dailyCap: 10, cooldownMs: 60_000 },
  DIRECT_MESSAGE: { xp: 3, dailyCap: 8, cooldownMs: 60_000 },
  FRIENDSHIP: { xp: 20 },
};

type ProgressionTransaction = Prisma.TransactionClient;

export interface ProgressionAchievementView {
  code: ProgressionAchievementCode;
  category: string;
  iconKey: string;
  unlockedAt: string | null;
}

export interface ProgressionProfileData {
  progress: PublicProgress;
  achievements: ProgressionAchievementView[];
}

export interface ProgressionAwardResult {
  awarded: boolean;
  progress: PublicProgress;
  unlockedCodes: ProgressionAchievementCode[];
  levelUp: number | null;
}

function startOfUtcDay(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function activityAwardAllowed({
  config,
  now,
  awardedToday,
  mostRecentAwardAt,
}: {
  config: XpSourceConfig;
  now: Date;
  awardedToday: number;
  mostRecentAwardAt: Date | null;
}) {
  if (config.dailyCap !== undefined && awardedToday >= config.dailyCap) return false;
  if (config.cooldownMs && mostRecentAwardAt && now.getTime() - mostRecentAwardAt.getTime() < config.cooldownMs) {
    return false;
  }
  return true;
}

export interface ProgressionAchievementFacts {
  profileComplete: boolean;
  emailVerified: boolean;
  oauthConnections: number;
  globalMessages: number;
  directMessages: number;
  friendships: number;
  level: number;
}

/** Pure achievement rules keep the catalogue deterministic and easy to test. */
export function achievementCodesForFacts(facts: ProgressionAchievementFacts) {
  const eligible = new Set<ProgressionAchievementCode>();
  if (facts.profileComplete) eligible.add("PROFILE_COMPLETE");
  if (facts.emailVerified) eligible.add("EMAIL_VERIFIED");
  if (facts.oauthConnections > 0) eligible.add("OAUTH_CONNECTED");
  if (facts.globalMessages >= 1) eligible.add("FIRST_GLOBAL_MESSAGE");
  if (facts.globalMessages >= 10) eligible.add("GLOBAL_REGULAR");
  if (facts.directMessages >= 1) eligible.add("FIRST_DM");
  if (facts.directMessages >= 10) eligible.add("DM_REGULAR");
  if (facts.friendships >= 1) eligible.add("FIRST_FRIEND");
  if (facts.friendships >= 5) eligible.add("SOCIAL_FIVE");
  if (facts.level >= 5) eligible.add("LEVEL_FIVE");
  if (facts.level >= 10) eligible.add("LEVEL_TEN");
  return PROGRESSION_ACHIEVEMENTS.filter((achievement) => eligible.has(achievement.code)).map((achievement) => achievement.code);
}

async function sourceIsValid(
  tx: ProgressionTransaction,
  userId: string,
  source: ProgressionSource,
  sourceKey: string,
) {
  if (source === "PROFILE_COMPLETE") {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { bio: true, displayName: true, image: true, minecraftUsername: true, socialLinks: true },
    });
    return !!user && isProfileComplete(user);
  }
  if (source === "EMAIL_VERIFIED") {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
    return !!user?.emailVerified;
  }
  if (source === "OAUTH_CONNECTED") {
    const providerId = sourceKey.slice("oauth:".length);
    return Boolean(providerId) && !!(await tx.account.findFirst({
      where: { userId, providerId: { equals: providerId, not: "credential" } },
      select: { id: true },
    }));
  }
  return true;
}

async function isActivityWithinLimits(
  tx: ProgressionTransaction,
  userId: string,
  source: ProgressionSource,
  config: XpSourceConfig,
  now: Date,
) {
  if (config.dailyCap === undefined && config.cooldownMs === undefined) return true;
  const [awardedToday, latest] = await Promise.all([
    config.dailyCap === undefined
      ? Promise.resolve(0)
      : tx.progressEvent.count({
          where: { userId, source, createdAt: { gte: startOfUtcDay(now) } },
        }),
    config.cooldownMs === undefined
      ? Promise.resolve(null)
      : tx.progressEvent.findFirst({
          where: { userId, source },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
        }),
  ]);
  return activityAwardAllowed({
    config,
    now,
    awardedToday,
    mostRecentAwardAt: latest?.createdAt ?? null,
  });
}

async function eligibleAchievementCodes(
  tx: ProgressionTransaction,
  userId: string,
  level: number,
) {
  const [profileCompletions, emailVerifications, oauthConnections, globalMessages, directMessages, friendships] = await Promise.all([
    tx.progressEvent.count({ where: { userId, source: "PROFILE_COMPLETE" } }),
    tx.progressEvent.count({ where: { userId, source: "EMAIL_VERIFIED" } }),
    tx.progressEvent.count({ where: { userId, source: "OAUTH_CONNECTED" } }),
    tx.progressEvent.count({ where: { userId, source: "GLOBAL_MESSAGE" } }),
    tx.progressEvent.count({ where: { userId, source: "DIRECT_MESSAGE" } }),
    tx.progressEvent.count({ where: { userId, source: "FRIENDSHIP" } }),
  ]);
  return achievementCodesForFacts({
    profileComplete: profileCompletions > 0,
    emailVerified: emailVerifications > 0,
    oauthConnections,
    globalMessages,
    directMessages,
    friendships,
    level,
  });
}

async function unlockEligibleAchievements(
  tx: ProgressionTransaction,
  userId: string,
  level: number,
  alreadyUnlocked: Set<ProgressionAchievementCode>,
) {
  const candidates = await eligibleAchievementCodes(tx, userId, level);
  const unlocks: ProgressionAchievementCode[] = [];
  for (const code of candidates) {
    if (alreadyUnlocked.has(code)) continue;
    await tx.userProgressAchievement.create({ data: { userId, code } });
    alreadyUnlocked.add(code);
    unlocks.push(code);
  }
  return unlocks;
}

async function createProgressNotification(
  tx: ProgressionTransaction,
  userId: string,
  type: "LEVEL_UP" | "ACHIEVEMENT",
  entityType: string,
  entityId: string,
) {
  const preference = await tx.notificationPreference.findUnique({
    where: { userId_category: { userId, category: type } },
    select: { inAppEnabled: true },
  });
  if (!preference?.inAppEnabled) {
    if (preference) return;
  }
  await tx.notification.create({ data: { userId, type, entityType, entityId } });
}

function emptyResult(progress: { xp: number; level: number } | null, achievementCount: number): ProgressionAwardResult {
  return {
    awarded: false,
    progress: getProgressSummary(progress, achievementCount),
    unlockedCodes: [],
    levelUp: null,
  };
}

async function awardSource(
  userId: string,
  source: ProgressionSource,
  sourceKey: string,
): Promise<ProgressionAwardResult> {
  const config = XP_SOURCES[source];
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // This upsert takes a row-level lock for a user, so cap checks, idempotency,
    // XP, level changes, event logging, and unlocks stay serialized per member.
    const existingProgress = await tx.userProgress.upsert({
      where: { userId },
      create: { userId, xp: 0, level: 1 },
      update: { updatedAt: now },
    });
    const unlockedRows = await tx.userProgressAchievement.findMany({
      where: { userId },
      select: { code: true },
    });
    const unlocked = new Set(unlockedRows.map((row) => row.code as ProgressionAchievementCode));

    const [existingEvent, validSource, withinLimits] = await Promise.all([
      tx.progressEvent.findUnique({ where: { userId_sourceKey: { userId, sourceKey } }, select: { id: true } }),
      sourceIsValid(tx, userId, source, sourceKey),
      isActivityWithinLimits(tx, userId, source, config, now),
    ]);
    if (existingEvent || !validSource || !withinLimits) return emptyResult(existingProgress, unlocked.size);

    await tx.progressEvent.create({ data: { userId, source, sourceKey, xp: config.xp } });
    const baseXp = existingProgress.xp + config.xp;
    const baseLevel = levelForXp(baseXp);
    const firstUnlocks = await unlockEligibleAchievements(tx, userId, baseLevel, unlocked);
    const firstReward = firstUnlocks.reduce((total, code) => total + (PROGRESSION_ACHIEVEMENTS_BY_CODE.get(code)?.xpReward ?? 0), 0);

    // A single second pass handles a level milestone crossed by an achievement
    // reward without allowing achievement rewards to recurse indefinitely.
    const rewardedLevel = levelForXp(baseXp + firstReward);
    const milestoneUnlocks = await unlockEligibleAchievements(tx, userId, rewardedLevel, unlocked);
    const milestoneReward = milestoneUnlocks.reduce((total, code) => total + (PROGRESSION_ACHIEVEMENTS_BY_CODE.get(code)?.xpReward ?? 0), 0);
    const totalXp = baseXp + firstReward + milestoneReward;
    const finalLevel = levelForXp(totalXp);
    const allUnlocks = [...firstUnlocks, ...milestoneUnlocks];
    const updatedProgress = await tx.userProgress.update({
      where: { userId },
      data: { xp: totalXp, level: finalLevel },
    });

    // Each server-derived level and fixed progression achievement has its own
    // wallet source key. Existing v0.6 activity is never replayed: these run
    // only as part of a newly awarded source event.
    for (let level = existingProgress.level + 1; level <= finalLevel; level += 1) {
      await awardLevelCoins(tx, userId, level);
    }
    for (const code of allUnlocks) {
      const achievement = PROGRESSION_ACHIEVEMENTS_BY_CODE.get(code);
      if (achievement) {
        await awardAchievementCoins(tx, userId, `progression:${code}`, achievement.coinReward);
      }
    }

    if (finalLevel > existingProgress.level) {
      await createProgressNotification(tx, userId, "LEVEL_UP", "ProgressLevel", String(finalLevel));
    }
    await Promise.all(
      allUnlocks.map((code) =>
        createProgressNotification(tx, userId, "ACHIEVEMENT", "ProgressAchievement", code),
      ),
    );

    return {
      awarded: true,
      progress: getProgressSummary(updatedProgress, unlocked.size),
      unlockedCodes: allUnlocks,
      levelUp: finalLevel > existingProgress.level ? finalLevel : null,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  // Admin-created obtainable achievements use real application counters. This
  // runs after the XP transaction so LEVEL/XP conditions see the latest state.
  await evaluateAutomaticAchievements(userId, ACHIEVEMENT_TRIGGER_KEYS);
  return result;
}

// Integration-only entry points. No route accepts an XP amount, target user,
// source key, achievement code, or level from the browser.
export function awardProfileCompletion(userId: string) {
  return awardSource(userId, "PROFILE_COMPLETE", "profile:complete");
}

export function awardEmailVerification(userId: string) {
  return awardSource(userId, "EMAIL_VERIFIED", "email:verified");
}

export function awardOAuthConnection(userId: string, providerId: string) {
  return awardSource(userId, "OAUTH_CONNECTED", `oauth:${providerId}`);
}

export function awardGlobalMessage(userId: string, messageId: string) {
  return awardSource(userId, "GLOBAL_MESSAGE", `global-message:${messageId}`);
}

export function awardDirectMessage(userId: string, messageId: string) {
  return awardSource(userId, "DIRECT_MESSAGE", `direct-message:${messageId}`);
}

export function awardFriendship(userId: string, firstUserId: string, secondUserId: string) {
  const pair = [firstUserId, secondUserId].sort().join(":");
  return awardSource(userId, "FRIENDSHIP", `friendship:${pair}`);
}


export async function getPublicProgressSummary(userId: string): Promise<PublicProgress> {
  const [progress, achievementCount] = await Promise.all([
    prisma.userProgress.findUnique({ where: { userId }, select: { xp: true, level: true } }),
    prisma.userProgressAchievement.count({ where: { userId } }),
  ]);
  return getProgressSummary(progress, achievementCount);
}

export async function getPublicProgressionProfile(userId: string): Promise<ProgressionProfileData> {
  const [progress, unlocks] = await Promise.all([
    prisma.userProgress.findUnique({ where: { userId }, select: { xp: true, level: true } }),
    prisma.userProgressAchievement.findMany({
      where: { userId },
      select: { code: true, unlockedAt: true },
      orderBy: { unlockedAt: "desc" },
    }),
  ]);
  const unlocksByCode = new Map(unlocks.map((unlock) => [unlock.code, unlock.unlockedAt]));
  return {
    progress: getProgressSummary(progress, unlocks.length),
    achievements: PROGRESSION_ACHIEVEMENTS.map((achievement) => ({
      code: achievement.code,
      category: achievement.category,
      iconKey: achievement.iconKey,
      unlockedAt: unlocksByCode.get(achievement.code)?.toISOString() ?? null,
    })),
  };
}
