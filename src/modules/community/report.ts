import { prisma } from "@/infrastructure/database/prisma";

export class CommunityReportError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function reportComment(reporterId: string, commentId: string, reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) throw new CommunityReportError("Contá el motivo del reporte");

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.deletedAt) throw new CommunityReportError("Comentario no encontrado", 404);

  return prisma.report.create({
    data: { reporterId, targetType: "COMMENT", targetId: commentId, reason: trimmed },
  });
}
