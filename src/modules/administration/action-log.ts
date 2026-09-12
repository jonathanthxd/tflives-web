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

export interface AdminActionLogFilters {
  limit?: number;
  action?: string;
  actor?: string;
  targetId?: string;
}

export async function listAdminActionLog(filters: number | AdminActionLogFilters = 100) {
  const options = typeof filters === "number" ? { limit: filters } : filters;
  const limit = Math.min(Math.max(Math.floor(options.limit ?? 100), 1), 200);
  const action = options.action?.trim().slice(0, 80);
  const actor = options.actor?.trim().slice(0, 80);
  const targetId = options.targetId?.trim().slice(0, 120);

  const matchingActorIds = actor
    ? (await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: actor, mode: "insensitive" } },
            { displayName: { contains: actor, mode: "insensitive" } },
            { name: { contains: actor, mode: "insensitive" } },
          ],
        },
        select: { id: true },
        take: 100,
      })).map((user) => user.id)
    : undefined;

  if (actor && matchingActorIds?.length === 0) return [];

  const entries = await prisma.adminActionLog.findMany({
    where: {
      ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
      ...(matchingActorIds ? { actorId: { in: matchingActorIds } } : {}),
      ...(targetId ? { targetId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const entryActorIds = [...new Set(entries.map((e) => e.actorId))];
  const actors = entryActorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: entryActorIds } },
        select: { id: true, username: true, displayName: true, name: true },
      })
    : [];
  const actorsById = new Map(actors.map((a) => [a.id, a]));

  return entries.map((e) => ({ ...e, actor: actorsById.get(e.actorId) ?? null }));
}
