import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { ChatValidationError, hideGlobalChatMessage } from "@/modules/chat/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAdminSection("reports");
    const { id } = await params;
    const body = await request.json();
    if (body.action !== "hide") return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    const message = await hideGlobalChatMessage(userId, id);
    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof ChatValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al moderar el mensaje" }, { status: 500 });
  }
}
