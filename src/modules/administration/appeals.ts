import { prisma } from "@/infrastructure/database/prisma";
import { logAdminAction } from "@/modules/administration/action-log";
import { revokeSanction } from "@/modules/administration/sanctions";

export class AppealError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function isSanctionActive(s: { revokedAt: Date | null; expiresAt: Date | null }) {
  if (s.revokedAt) return false;
  if (!s.expiresAt) return true;
  return s.expiresAt > new Date();
}

/** Sanciones del usuario con su apelación más reciente, si tiene una. */
export async function listMySanctions(userId: string) {
  const sanctions = await prisma.userSanction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      appeals: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return sanctions.map((s) => ({
    id: s.id,
    type: s.type,
    reason: s.reason,
    expiresAt: s.expiresAt,
    revokedAt: s.revokedAt,
    createdAt: s.createdAt,
    active: isSanctionActive(s),
    appeal: s.appeals[0] ?? null,
  }));
}

export async function submitAppeal(userId: string, sanctionId: string, message: string) {
  const trimmed = message.trim();
  if (!trimmed) throw new AppealError("Contá por qué creés que esta sanción no debería aplicarse");
  if (trimmed.length > 2000) throw new AppealError("El mensaje es demasiado largo");

  const sanction = await prisma.userSanction.findUnique({ where: { id: sanctionId } });
  if (!sanction || sanction.userId !== userId) {
    throw new AppealError("Sanción no encontrada", 404);
  }
  if (!isSanctionActive(sanction)) {
    throw new AppealError("Esta sanción ya no está activa");
  }

  const existing = await prisma.sanctionAppeal.findFirst({
    where: { sanctionId, status: "PENDING" },
  });
  if (existing) throw new AppealError("Ya enviaste una apelación para esta sanción");

  return prisma.sanctionAppeal.create({
    data: { sanctionId, userId, message: trimmed },
  });
}

export async function listAppeals(status?: "PENDING" | "APPROVED" | "DENIED") {
  const appeals = await prisma.sanctionAppeal.findMany({
    where: status ? { status } : undefined,
    include: {
      sanction: true,
      user: { select: { id: true, username: true, displayName: true, name: true } },
      reviewedBy: { select: { id: true, username: true, displayName: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return appeals;
}

export async function resolveAppeal(
  reviewerId: string,
  appealId: string,
  decision: "approve" | "deny",
  note: string
) {
  const appeal = await prisma.sanctionAppeal.findUnique({ where: { id: appealId } });
  if (!appeal) throw new AppealError("Apelación no encontrada", 404);
  if (appeal.status !== "PENDING") throw new AppealError("Esta apelación ya fue resuelta");

  if (decision === "approve") {
    await revokeSanction(reviewerId, appeal.sanctionId);
  }

  const updated = await prisma.sanctionAppeal.update({
    where: { id: appealId },
    data: {
      status: decision === "approve" ? "APPROVED" : "DENIED",
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      reviewNote: note.trim() || null,
    },
  });

  await logAdminAction({
    actorId: reviewerId,
    action: decision === "approve" ? "appeal.approve" : "appeal.deny",
    targetType: "SanctionAppeal",
    targetId: appealId,
    metadata: { sanctionId: appeal.sanctionId, userId: appeal.userId },
  });

  return updated;
}
