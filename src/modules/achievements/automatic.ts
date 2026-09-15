import { prisma } from "@/infrastructure/database/prisma";
import { createNotification } from "@/modules/notifications/service";
import { awardAchievementCoins } from "@/modules/economy/service";
import { isProfileComplete } from "@/modules/profiles/completion";
import type { AchievementTriggerKey } from "@/modules/achievements/triggers";

export type AutomaticAchievementNotificationMode = "all" | "significant-per-trigger";

interface AutomaticAchievementCandidate {
  id: string;
  trigger: AchievementTriggerKey;
  triggerValue: number;
}

async function resolveTriggerValue(userId: string, trigger: AchievementTriggerKey): Promise<number> {
  switch (trigger) {
    case "GLOBAL_MESSAGES":
      return prisma.globalChatMessage.count({ where: { authorId: userId, deletedAt: null } });
    case "DIRECT_MESSAGES":
      return prisma.directMessage.count({ where: { senderId: userId, deletedAt: null } });
    case "FRIENDSHIPS":
      return prisma.friendship.count({
        where: {
          status: "ACCEPTED",
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
      });
    case "LEVEL": {
      const progress = await prisma.userProgress.findUnique({ where: { userId }, select: { level: true } });
      return progress?.level ?? 1;
    }
    case "XP": {
      const progress = await prisma.userProgress.findUnique({ where: { userId }, select: { xp: true } });
      return progress?.xp ?? 0;
    }
    case "PROFILE_COMPLETE": {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { bio: true, displayName: true, image: true, minecraftUsername: true, socialLinks: true },
      });
      return user && isProfileComplete(user) ? 1 : 0;
    }
    case "EMAIL_VERIFIED": {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
      return user?.emailVerified ? 1 : 0;
    }
    case "OAUTH_CONNECTIONS":
      return prisma.account.count({ where: { userId, providerId: { not: "credential" } } });
  }
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "P2002");
}

/**
 * Catch-up can discover several thresholds from the same trigger at once. All
 * qualifying rows/rewards are still persisted, but only the highest threshold
 * in each trigger family needs to surface as a notification.
 */
export function selectAutomaticAchievementNotificationIds(
  candidates: readonly AutomaticAchievementCandidate[],
  mode: AutomaticAchievementNotificationMode,
) {
  if (mode === "all") return new Set(candidates.map((candidate) => candidate.id));

  const highestByTrigger = new Map<AchievementTriggerKey, AutomaticAchievementCandidate>();
  for (const candidate of candidates) {
    const current = highestByTrigger.get(candidate.trigger);
    if (!current || candidate.triggerValue > current.triggerValue) {
      highestByTrigger.set(candidate.trigger, candidate);
    }
  }
  return new Set([...highestByTrigger.values()].map((candidate) => candidate.id));
}

/**
 * Evaluates the active automatic catalogue after real server-side activity.
 * Only trigger families actually used by the catalogue are queried. Achievement
 * amounts and recipients never come from the browser.
 */
export async function evaluateAutomaticAchievements(
  userId: string,
  triggers: readonly AchievementTriggerKey[],
  notificationMode: AutomaticAchievementNotificationMode = "all",
) {
  const uniqueTriggers = [...new Set(triggers)];
  if (!uniqueTriggers.length) return [];

  const achievements = await prisma.achievement.findMany({
    where: {
      active: true,
      unlockMode: "AUTOMATIC",
      trigger: { in: uniqueTriggers },
      triggerValue: { not: null },
    },
    select: { id: true, name: true, trigger: true, triggerValue: true, coinReward: true },
  });
  if (!achievements.length) return [];

  const existing = await prisma.userAchievement.findMany({
    where: { userId, achievementId: { in: achievements.map((achievement) => achievement.id) } },
    select: { achievementId: true },
  });
  const alreadyEarned = new Set(existing.map((award) => award.achievementId));

  const neededTriggers = [
    ...new Set(
      achievements
        .map((achievement) => achievement.trigger as AchievementTriggerKey | null)
        .filter((trigger): trigger is AchievementTriggerKey => Boolean(trigger)),
    ),
  ];
  const values = new Map<AchievementTriggerKey, number>();
  await Promise.all(
    neededTriggers.map(async (trigger) => {
      values.set(trigger, await resolveTriggerValue(userId, trigger));
    }),
  );

  const candidates = achievements.flatMap((achievement) => {
    if (alreadyEarned.has(achievement.id) || !achievement.trigger || achievement.triggerValue == null) return [];
    const trigger = achievement.trigger as AchievementTriggerKey;
    if ((values.get(trigger) ?? 0) < achievement.triggerValue) return [];
    return [{ ...achievement, trigger, triggerValue: achievement.triggerValue }];
  });
  const notificationIds = selectAutomaticAchievementNotificationIds(candidates, notificationMode);

  const unlocked: string[] = [];
  for (const achievement of candidates) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            source: "AUTOMATIC",
            awardedById: null,
          },
        });
        await awardAchievementCoins(tx, userId, achievement.id, achievement.coinReward);
        if (notificationIds.has(achievement.id)) {
          await createNotification({
            userId,
            type: "ACHIEVEMENT",
            entityType: "Achievement",
            entityId: achievement.id,
          }, tx);
        }
      });
      unlocked.push(achievement.id);
    } catch (error) {
      // Concurrent actions can evaluate the same achievement; the compound
      // unique key is the authority and avoids duplicate awards/notifications.
      if (!isUniqueConstraintError(error)) throw error;
    }
  }

  return unlocked;
}
