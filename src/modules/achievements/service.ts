import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { logAdminAction } from "@/modules/administration/action-log";
import { createNotification } from "@/modules/notifications/service";
import { ACHIEVEMENT_ICONS } from "@/modules/administration/components/ui/icons";

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
}

function validateIconKey(iconKey: string) {
  if (!listAchievementIconKeys().includes(iconKey)) {
    throw new AchievementError("Ícono inválido");
  }
}

export async function createAchievement(createdById: string, input: AchievementInput) {
  const name = input.name.trim();
  const description = input.description.trim();
  if (!name) throw new AchievementError("El nombre es obligatorio");
  if (!description) throw new AchievementError("La descripción es obligatoria");
  validateIconKey(input.iconKey);

  const achievement = await prisma.achievement.create({
    data: {
      name,
      description,
      iconKey: input.iconKey,
      order: input.order ?? 0,
      active: input.active ?? true,
      createdById,
    },
  });

  await logAdminAction({
    actorId: createdById,
    action: "achievement.create",
    targetType: "Achievement",
    targetId: achievement.id,
    metadata: { name },
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

  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId: user.id, achievementId } },
  });
  if (existing) throw new AchievementError("El usuario ya tiene este logro");

  const award = await prisma.userAchievement.create({
    data: { userId: user.id, achievementId, awardedById },
  });

  await Promise.all([
    logAdminAction({
      actorId: awardedById,
      action: "achievement.award",
      targetType: "User",
      targetId: user.id,
      metadata: { achievementId, achievementName: achievement.name },
    }),
    createNotification({
      userId: user.id,
      type: "ACHIEVEMENT",
      actorId: awardedById,
      entityType: "Achievement",
      entityId: achievement.id,
    }),
  ]);

  return award;
}

export async function revokeAchievement(actorId: string, userId: string, achievementId: string) {
  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId } },
  });
  if (!existing) throw new AchievementError("El usuario no tiene este logro", 404);

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

  return awards.map((a) => ({
    userId: a.user.id,
    username: a.user.username,
    displayName: a.user.displayName || a.user.name || a.user.username,
    awardedAt: a.awardedAt,
  }));
}

export async function listUserAchievements(username: string) {
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) throw new AchievementError("Usuario no encontrado", 404);

  const awards = await prisma.userAchievement.findMany({
    where: { userId: user.id, achievement: { active: true } },
    include: { achievement: true },
    orderBy: { awardedAt: "desc" },
  });

  return awards.map((a) => ({
    id: a.id,
    awardedAt: a.awardedAt,
    achievement: {
      id: a.achievement.id,
      name: a.achievement.name,
      description: a.achievement.description,
      iconKey: a.achievement.iconKey,
    },
  }));
}
