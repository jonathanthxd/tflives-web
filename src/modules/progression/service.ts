import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import {
  LEGACY_PROGRESSION_ACHIEVEMENTS,
  PRODUCTION_PROGRESSION_ACHIEVEMENTS,
  PROGRESSION_ACHIEVEMENTS,
  PROGRESSION_ACHIEVEMENTS_BY_CODE,
  progressionAchievementCopy,
  type ProgressionAchievement,
  type ProgressionAchievementCode,
  type ProgressionMetric,
} from "@/modules/progression/catalog";
import { getProgressSummary, levelForXp, type PublicProgress } from "@/modules/progression/level";
import { isProfileComplete } from "@/modules/profiles/completion";
import { evaluateAutomaticAchievements } from "@/modules/achievements/automatic";
import type { AchievementTriggerKey } from "@/modules/achievements/triggers";
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

const AUTOMATIC_TRIGGERS_BY_SOURCE: Record<ProgressionSource, readonly AchievementTriggerKey[]> = {
  PROFILE_COMPLETE: ["PROFILE_COMPLETE", "XP", "LEVEL"],
  EMAIL_VERIFIED: ["EMAIL_VERIFIED", "XP", "LEVEL"],
  OAUTH_CONNECTED: ["OAUTH_CONNECTIONS", "XP", "LEVEL"],
  GLOBAL_MESSAGE: ["GLOBAL_MESSAGES", "XP", "LEVEL"],
  DIRECT_MESSAGE: ["DIRECT_MESSAGES", "XP", "LEVEL"],
  FRIENDSHIP: ["FRIENDSHIPS", "XP", "LEVEL"],
};

const RECONCILIATION_MAX_ATTEMPTS = 3;

type ProgressionTransaction = Prisma.TransactionClient;

export interface ProgressionAchievementView {
  code: ProgressionAchievementCode;
  category: string;
  iconKey: string;
  title: string;
  description: string;
  coinReward: number;
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
  xp: number;
}

function metricValue(facts: ProgressionAchievementFacts, metric: ProgressionMetric) {
  switch (metric) {
    case "PROFILE_COMPLETE": return facts.profileComplete ? 1 : 0;
    case "EMAIL_VERIFIED": return facts.emailVerified ? 1 : 0;
    case "OAUTH_CONNECTIONS": return facts.oauthConnections;
    case "GLOBAL_MESSAGES": return facts.globalMessages;
    case "DIRECT_MESSAGES": return facts.directMessages;
    case "FRIENDSHIPS": return facts.friendships;
    case "LEVEL": return facts.level;
    case "XP": return facts.xp;
  }
}

function achievementRequirementsMet(achievement: ProgressionAchievement, facts: ProgressionAchievementFacts) {
  return achievement.requirements.every((requirement) => metricValue(facts, requirement.metric) >= requirement.min);
}

/** Pure production rules: every milestone is derived from server-owned facts. */
export function achievementCodesForFacts(facts: ProgressionAchievementFacts) {
  return PROGRESSION_ACHIEVEMENTS
    .filter((achievement) => achievementRequirementsMet(achievement, facts))
    .map((achievement) => achievement.code);
}

type ProgressionDatabase = Prisma.TransactionClient;

async function resolveProgressionFacts(
  client: ProgressionDatabase,
  userId: string,
  overrides: { level?: number; xp?: number } = {},
): Promise<ProgressionAchievementFacts> {
  const [user, oauthConnections, globalMessages, directMessages, friendships, progress] = await Promise.all([
    client.user.findUnique({
      where: { id: userId },
      select: {
        bio: true,
        displayName: true,
        image: true,
        minecraftUsername: true,
        socialLinks: true,
        emailVerified: true,
      },
    }),
    client.account.count({ where: { userId, providerId: { not: "credential" } } }),
    client.globalChatMessage.count({ where: { authorId: userId, deletedAt: null } }),
    client.directMessage.count({ where: { senderId: userId, deletedAt: null } }),
    client.friendship.count({
      where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    }),
    client.userProgress.findUnique({ where: { userId }, select: { level: true, xp: true } }),
  ]);

  return {
    profileComplete: Boolean(user && isProfileComplete(user)),
    emailVerified: Boolean(user?.emailVerified),
    oauthConnections,
    globalMessages,
    directMessages,
    friendships,
    level: overrides.level ?? progress?.level ?? 1,
    xp: overrides.xp ?? progress?.xp ?? 0,
  };
}

async function eligibleAchievementCodes(
  tx: ProgressionTransaction,
  userId: string,
  level: number,
) {
  // Legacy v0.6 achievements keep their original XP-reward flow. The 200
  // production milestones are reconciled after this transaction so they can
  // never recursively alter level calculations.
  const facts = await resolveProgressionFacts(tx, userId, { level });
  return LEGACY_PROGRESSION_ACHIEVEMENTS
    .filter((achievement) => achievementRequirementsMet(achievement, facts))
    .map((achievement) => achievement.code);
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

const PRODUCTION_CHECKPOINTS = new Map<ProgressionMetric, Set<number>>();
for (const achievement of PRODUCTION_PROGRESSION_ACHIEVEMENTS) {
  for (const requirement of achievement.requirements) {
    const values = PRODUCTION_CHECKPOINTS.get(requirement.metric) ?? new Set<number>();
    values.add(requirement.min);
    PRODUCTION_CHECKPOINTS.set(requirement.metric, values);
  }
}

async function sourceReachedProductionCheckpoint(userId: string, source: ProgressionSource) {
  let metric: ProgressionMetric | null = null;
  let value = 0;

  if (source === "GLOBAL_MESSAGE") {
    metric = "GLOBAL_MESSAGES";
    value = await prisma.globalChatMessage.count({ where: { authorId: userId, deletedAt: null } });
  } else if (source === "DIRECT_MESSAGE") {
    metric = "DIRECT_MESSAGES";
    value = await prisma.directMessage.count({ where: { senderId: userId, deletedAt: null } });
  } else {
    return false;
  }

  return PRODUCTION_CHECKPOINTS.get(metric)?.has(value) ?? false;
}

function isPrismaErrorCode(error: unknown, codes: readonly string[]) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    codes.includes(String((error as { code?: unknown }).code)),
  );
}

export function isRetryableAchievementReconciliationError(error: unknown) {
  // P2002 can occur when another reconciliation wins the same unique unlock.
  // P2034 is Prisma's transaction write-conflict/deadlock code.
  return isPrismaErrorCode(error, ["P2002", "P2034"]);
}

async function reconcileProgressionAchievementsAttempt(userId: string) {
  return prisma.$transaction(async (tx) => {
    const progress = await tx.userProgress.upsert({
      where: { userId },
      create: { userId, xp: 0, level: 1 },
      update: { updatedAt: new Date() },
    });
    const existing = await tx.userProgressAchievement.findMany({
      where: { userId },
      select: { code: true },
    });
    const unlocked = new Set(existing.map((row) => row.code as ProgressionAchievementCode));
    const initialLevel = levelForXp(progress.xp);
    let workingXp = progress.xp;
    let workingLevel = initialLevel;
    const baseFacts = await resolveProgressionFacts(tx, userId, { level: workingLevel, xp: workingXp });
    const newlyUnlocked: ProgressionAchievementCode[] = [];

    // Reconcile from current server truth, not from historical client events.
    // Legacy achievements may add XP, so repeat a bounded number of passes to
    // allow those rewards to unlock level-based milestones. Production
    // achievements grant no XP, making the loop converge immediately.
    for (let pass = 0; pass < 5; pass += 1) {
      const facts: ProgressionAchievementFacts = {
        ...baseFacts,
        level: workingLevel,
        xp: workingXp,
      };
      const candidates = PROGRESSION_ACHIEVEMENTS.filter(
        (achievement) => !unlocked.has(achievement.code) && achievementRequirementsMet(achievement, facts),
      );
      if (!candidates.length) break;

      let xpReward = 0;
      for (const achievement of candidates) {
        await tx.userProgressAchievement.create({ data: { userId, code: achievement.code } });
        unlocked.add(achievement.code);
        newlyUnlocked.push(achievement.code);
        xpReward += achievement.xpReward;
        await awardAchievementCoins(tx, userId, `progression:${achievement.code}`, achievement.coinReward);
      }

      workingXp += xpReward;
      workingLevel = levelForXp(workingXp);
    }

    if (workingXp !== progress.xp || workingLevel !== progress.level) {
      await tx.userProgress.update({
        where: { userId },
        data: { xp: workingXp, level: workingLevel },
      });
    }

    for (let level = initialLevel + 1; level <= workingLevel; level += 1) {
      await awardLevelCoins(tx, userId, level);
    }

    if (newlyUnlocked.length) {
      // Catch-up can unlock dozens of milestones for an established member.
      // Persist every valid unlock/reward, but surface at most one notification
      // per category so reconciliation never becomes notification spam.
      const notifyByCategory = new Map<string, ProgressionAchievementCode>();
      for (const code of newlyUnlocked) {
        const achievement = PROGRESSION_ACHIEVEMENTS_BY_CODE.get(code);
        if (achievement) notifyByCategory.set(achievement.category, code);
      }
      for (const code of notifyByCategory.values()) {
        await createProgressNotification(tx, userId, "ACHIEVEMENT", "ProgressAchievement", code);
      }
    }

    if (workingLevel > initialLevel) {
      await createProgressNotification(tx, userId, "LEVEL_UP", "ProgressLevel", String(workingLevel));
    }

    return newlyUnlocked;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function reconcileProgressionAchievements(userId: string) {
  for (let attempt = 1; attempt <= RECONCILIATION_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await reconcileProgressionAchievementsAttempt(userId);
    } catch (error) {
      if (attempt === RECONCILIATION_MAX_ATTEMPTS || !isRetryableAchievementReconciliationError(error)) {
        throw error;
      }
    }
  }

  return [];
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

  // Reconcile the fixed catalogue against current server facts outside the XP
  // source transaction. This catches both current activity and milestones that
  // may predate the achievement rollout.
  if (result.awarded || await sourceReachedProductionCheckpoint(userId, source)) {
    await reconcileProgressionAchievements(userId);
  }

  // Admin-created obtainable achievements continue using their independent
  // database-backed catalogue and real application counters.
  await evaluateAutomaticAchievements(userId, AUTOMATIC_TRIGGERS_BY_SOURCE[source]);
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

export async function getPublicProgressionProfile(userId: string, locale = "es"): Promise<ProgressionProfileData> {
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
    achievements: PROGRESSION_ACHIEVEMENTS.map((achievement) => {
      const copy = progressionAchievementCopy(achievement, locale);
      return {
        code: achievement.code,
        category: achievement.category,
        iconKey: achievement.iconKey,
        title: copy.title,
        description: copy.description,
        coinReward: achievement.coinReward,
        unlockedAt: unlocksByCode.get(achievement.code)?.toISOString() ?? null,
      };
    }),
  };
}
