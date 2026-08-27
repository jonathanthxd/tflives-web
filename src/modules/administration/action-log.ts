import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

interface LogAdminActionInput {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function logAdminAction({ actorId, action, targetType, targetId, metadata }: LogAdminActionInput) {
  return prisma.adminActionLog.create({
    data: { actorId, action, targetType, targetId, metadata },
  });
}

export async function listAdminActionLog(limit = 100) {
  const entries = await prisma.adminActionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const actorIds = [...new Set(entries.map((e) => e.actorId))];
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, username: true, displayName: true, name: true },
      })
    : [];
  const actorsById = new Map(actors.map((a) => [a.id, a]));

  return entries.map((e) => ({ ...e, actor: actorsById.get(e.actorId) ?? null }));
}
