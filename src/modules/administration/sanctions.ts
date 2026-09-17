import { SanctionType } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { logAdminAction } from "@/modules/administration/action-log";

export class SanctionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function activeSanctionWhere(userId: string, type?: SanctionType) {
  return {
    userId,
    ...(type ? { type } : {}),
    revokedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}

export async function getActiveSanctions(userId: string) {
  return prisma.userSanction.findMany({
    where: activeSanctionWhere(userId),
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveBanOrSuspension(userId: string) {
  const sanctions = await prisma.userSanction.findMany({
    where: { userId, revokedAt: null, type: { in: ["BAN", "SUSPEND"] } },
  });
  const now = new Date();
  return sanctions.find((s) => !s.expiresAt || s.expiresAt > now) ?? null;
}

export async function isMuted(userId: string) {
  const sanctions = await prisma.userSanction.findMany({
    where: { userId, revokedAt: null, type: "MUTE" },
  });
  const now = new Date();
  return sanctions.some((s) => !s.expiresAt || s.expiresAt > now);
}

export async function applySanction(
  issuedById: string,
  userId: string,
  type: SanctionType,
  reason: string,
  expiresAt: Date | null
) {
  if (!reason.trim()) throw new SanctionError("Contá el motivo de la sanción");
  if (userId === issuedById) throw new SanctionError("No podés sancionarte a vos mismo");

  if (reason.trim().length > 2000) throw new SanctionError("El motivo es demasiado largo");
  if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date())) throw new SanctionError("La fecha de expiración debe ser futura");
  const [actor, target] = await Promise.all([prisma.user.findUnique({ where: { id: issuedById }, select: { role: true } }), prisma.user.findUnique({ where: { id: userId }, select: { role: true } })]);
  if (!target) throw new SanctionError("Usuario no encontrado", 404);
  if (!actor || actor.role === "USER" || (actor.role === "MOD" && target.role !== "USER")) throw new SanctionError("No autorizado", 403);

  const sanction = await prisma.userSanction.create({
    data: { userId, type, reason: reason.trim(), issuedById, expiresAt },
  });

  await logAdminAction({
    actorId: issuedById,
    action: `sanction.${type.toLowerCase()}`,
    targetType: "User",
    targetId: userId,
    metadata: { reason, expiresAt: expiresAt?.toISOString() ?? null },
  });

  return sanction;
}

export async function revokeSanction(issuedById: string, sanctionId: string) {
  const sanction = await prisma.userSanction.findUnique({ where: { id: sanctionId } });
  if (!sanction || sanction.revokedAt) {
    throw new SanctionError("La sanción no existe o ya fue revocada", 404);
  }

  const updated = await prisma.userSanction.update({
    where: { id: sanctionId },
    data: { revokedAt: new Date() },
  });

  await logAdminAction({
    actorId: issuedById,
    action: `sanction.revoke.${sanction.type.toLowerCase()}`,
    targetType: "User",
    targetId: sanction.userId,
  });

  return updated;
}

/** Usado por servicios de otros módulos (mensajería, posts, amigos) para
 * bloquear acciones de usuarios baneados/suspendidos. */
export async function assertNotBanned(userId: string) {
  const active = await getActiveBanOrSuspension(userId);
  if (active) {
    throw new SanctionError("Tu cuenta está suspendida", 403);
  }
}

export async function listUserSanctions(userId: string) {
  return prisma.userSanction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
