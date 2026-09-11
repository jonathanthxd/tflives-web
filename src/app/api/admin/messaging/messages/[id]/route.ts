import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { prisma } from "@/infrastructure/database/prisma";
import { logAdminAction } from "@/modules/administration/action-log";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAdminSection("reports");
    const { id } = await params;
    const body = await request.json();
    if (body.action !== "hide") return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    const message = await prisma.directMessage.findUnique({ where: { id } });
    if (!message) return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
    const updated = message.deletedAt ? message : await prisma.directMessage.update({ where: { id }, data: { deletedAt: new Date() } });
    await logAdminAction({ actorId: userId, action: "direct-message.hide", targetType: "DirectMessage", targetId: id, metadata: { senderId: message.senderId, conversationId: message.conversationId } });
    return NextResponse.json({ message: updated });
  } catch (error) {
    if (error instanceof AdminGuardError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Error al moderar el mensaje" }, { status: 500 });
  }
}
