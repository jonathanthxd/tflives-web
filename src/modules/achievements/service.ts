import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { logAdminAction } from "@/modules/administration/action-log";
import { createNotification } from "@/modules/notifications/service";
import { awardAchievementCoins, MAX_ACHIEVEMENT_COIN_REWARD } from "@/modules/economy/service";
import { ACHIEVEMENT_ICONS } from "@/modules/administration/components/ui/icons";
import {
  isAchievementTrigger,
  normalizedTriggerValue,
  type AchievementUnlockModeKey,
} from "@/modules/achievements/triggers";

export class AchievementError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function listAchievementIconKeys(): string[] {
  return Object.keys(ACHIEVEMENT_ICONS);
}

export async function listAllAchievements() {
  return prisma.achievement.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { awards: true } } },
  });
}

interface AchievementInput {
  name: string;
  description: string;
  iconKey: string;
  order?: number;
  active?: boolean;
  unlockMode?: AchievementUnlockModeKey;
  trigger?: string | null;
  triggerValue?: number | null;
  coinReward?: number;
}

function validateIconKey(iconKey: string) {
  if (!listAchievementIconKeys().includes(iconKey)) {
    throw new AchievementError("Ícono inválido");
  }
}

function normalizeAutomation(input: {
  unlockMode: AchievementUnlockModeKey;
  trigger?: string | null;
  triggerValue?: number | null;
}) {
  if (input.unlockMode === "MANUAL") {
    return { unlockMode: "MANUAL" as const, trigger: null, triggerValue: null };
  }

  if (!isAchievementTrigger(input.trigger)) {
    throw new AchievementError("Elegí cómo se obtiene este logro");
  }
  const triggerValue = normalizedTriggerValue(input.trigger, input.triggerValue);
  if (triggerValue == null) {
    throw new AchievementError("La meta debe ser un número entero entre 1 y 1.000.000");
  }

  return {
    unlockMode: "AUTOMATIC" as const,
    trigger: input.trigger,
    triggerValue,
  };
}

function normalizeCoinReward(value: unknown) {
  const coinReward = value === undefined ? 0 : Number(value);
  if (!Number.isInteger(coinReward) || coinReward < 0 || coinReward > MAX_ACHIEVEMENT_COIN_REWARD) {
    throw new AchievementError(`La recompensa de TFL Coins debe ser un entero entre 0 y ${MAX_ACHIEVEMENT_COIN_REWARD.toLocaleString("es-CO")}`);
  }
  return coinReward;
}

export async function createAchievement(createdById: string, input: AchievementInput) {
  const name = input.name.trim();
  const description = input.description.trim();
  if (!name) throw new AchievementError("El nombre es obligatorio");
  if (!description) throw new AchievementError("La descripción es obligatoria");
  validateIconKey(input.iconKey);
  const automation = normalizeAutomation({
    unlockMode: input.unlockMode ?? "MANUAL",
    trigger: input.trigger,
    triggerValue: input.triggerValue,
  });
  const coinReward = normalizeCoinReward(input.coinReward);

  const achievement = await prisma.achievement.create({
    data: {
      name,
      description,
      iconKey: input.iconKey,
      order: input.order ?? 0,
      active: input.active ?? true,
      ...automation,
      coinReward,
      createdById,
    },
  });

  await logAdminAction({
    actorId: createdById,
    action: "achievement.create",
    targetType: "Achievement",
    targetId: achievement.id,
    metadata: {
      name,
      unlockMode: automation.unlockMode,
      trigger: automation.trigger,
      triggerValue: automation.triggerValue,
      coinReward,
    },
  });

  return achievement;
}

export async function updateAchievement(actorId: string, id: string, input: Partial<AchievementInput>) {
  const existing = await prisma.achievement.findUnique({ where: { id } });
  if (!existing) throw new AchievementError("Logro no encontrado", 404);

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new AchievementError("El nombre es obligatorio");
    data.name = name;
  }
  if (input.description !== undefined) {
    const description = input.description.trim();
    if (!description) throw new AchievementError("La descripción es obligatoria");
    data.description = description;
  }
  if (input.iconKey !== undefined) {
    validateIconKey(input.iconKey);
    data.iconKey = input.iconKey;
  }
  if (input.order !== undefined) data.order = input.order;
  if (input.active !== undefined) data.active = input.active;
  if (input.coinReward !== undefined) data.coinReward = normalizeCoinReward(input.coinReward);

  if (input.unlockMode !== undefined || input.trigger !== undefined || input.triggerValue !== undefined) {
    const automation = normalizeAutomation({
      unlockMode: input.unlockMode ?? (existing.unlockMode as AchievementUnlockModeKey),
      trigger: input.trigger !== undefined ? input.trigger : (existing.trigger as string | null),
      triggerValue: input.triggerValue !== undefined ? input.triggerValue : existing.triggerValue,
    });
    data.unlockMode = automation.unlockMode;
    data.trigger = automation.trigger;
    data.triggerValue = automation.triggerValue;
  }

  const updated = await prisma.achievement.update({ where: { id }, data });

  await logAdminAction({
    actorId,
    action: "achievement.update",
    targetType: "Achievement",
    targetId: id,
    metadata: data as Prisma.InputJsonValue,
  });

  return updated;
}

export async function deleteAchievement(actorId: string, id: string) {
  const existing = await prisma.achievement.findUnique({ where: { id } });
  if (!existing) throw new AchievementError("Logro no encontrado", 404);

  await prisma.achievement.delete({ where: { id } });

  await logAdminAction({
    actorId,
    action: "achievement.delete",
    targetType: "Achievement",
    targetId: id,
    metadata: { name: existing.name },
  });
}

export async function awardAchievement(awardedById: string, username: string, achievementId: string) {
  const [user, achievement] = await Promise.all([
    prisma.user.findUnique({ where: { username }, select: { id: true, username: true } }),
    prisma.achievement.findUnique({ where: { id: achievementId } }),
  ]);
  if (!user) throw new AchievementError("Usuario no encontrado", 404);
  if (!achievement) throw new AchievementError("Logro no encontrado", 404);
  if (achievement.unlockMode === "AUTOMATIC") {
    throw new AchievementError("Este logro se obtiene automáticamente al cumplir su meta");
  }

  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId: user.id, achievementId } },
  });
  if (existing) throw new AchievementError("El usuario ya tiene este logro");

  const award = await prisma.$transaction(async (tx) => {
    const created = await tx.userAchievement.create({
      data: { userId: user.id, achievementId, awardedById, source: "MANUAL" },
    });
    await awardAchievementCoins(tx, user.id, achievement.id, achievement.coinReward);
    await createNotification({
      userId: user.id,
      type: "ACHIEVEMENT",
      actorId: awardedById,
      entityType: "Achievement",
      entityId: achievement.id,
    }, tx);
    await tx.adminActionLog.create({
      data: {
        actorId: awardedById,
        action: "achievement.award",
        targetType: "User",
        targetId: user.id,
        metadata: { achievementId, achievementName: achievement.name, coinReward: achievement.coinReward },
      },
    });
    return created;
  });

  return award;
}

export async function revokeAchievement(actorId: string, userId: string, achievementId: string) {
  const [existing, achievement] = await Promise.all([
    prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
    }),
    prisma.achievement.findUnique({ where: { id: achievementId }, select: { unlockMode: true } }),
  ]);
  if (!existing) throw new AchievementError("El usuario no tiene este logro", 404);
  if (achievement?.unlockMode === "AUTOMATIC") {
    throw new AchievementError("Los logros automáticos no se revocan manualmente");
  }

  await prisma.userAchievement.delete({ where: { id: existing.id } });

  await logAdminAction({
    actorId,
    action: "achievement.revoke",
    targetType: "User",
    targetId: userId,
    metadata: { achievementId },
  });
}

export async function listAchievementHolders(achievementId: string) {
  const awards = await prisma.userAchievement.findMany({
    where: { achievementId },
    include: { user: { select: { id: true, username: true, displayName: true, name: true } } },
    orderBy: { awardedAt: "desc" },
  });

  return awards.map((award) => ({
    userId: award.user.id,
    username: award.user.username,
    displayName: award.user.displayName || award.user.name || award.user.username,
    awardedAt: award.awardedAt,
    source: award.source,
  }));
}

/** Manual/community badges only. Obtainable automatic achievements are exposed
 * separately so locked challenges can be shown without duplicating unlocked ones. */
export async function listUserAchievements(username: string) {
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) throw new AchievementError("Usuario no encontrado", 404);

  const awards = await prisma.userAchievement.findMany({
    where: {
      userId: user.id,
      achievement: { active: true, unlockMode: "MANUAL" },
    },
    include: { achievement: true },
    orderBy: { awardedAt: "desc" },
  });

  return awards.map((award) => ({
    id: award.id,
    awardedAt: award.awardedAt,
    achievement: {
      id: award.achievement.id,
      name: award.achievement.name,
      description: award.achievement.description,
      iconKey: award.achievement.iconKey,
    },
  }));
}

export async function listUserObtainableAchievements(username: string) {
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) throw new AchievementError("Usuario no encontrado", 404);

  const achievements = await prisma.achievement.findMany({
    where: { active: true, unlockMode: "AUTOMATIC" },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      iconKey: true,
      trigger: true,
      triggerValue: true,
      awards: {
        where: { userId: user.id },
        select: { awardedAt: true },
        take: 1,
      },
    },
  });

  return achievements.map((achievement) => ({
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    iconKey: achievement.iconKey,
    trigger: achievement.trigger,
    triggerValue: achievement.triggerValue,
    unlockedAt: achievement.awards[0]?.awardedAt ?? null,
  }));
}
