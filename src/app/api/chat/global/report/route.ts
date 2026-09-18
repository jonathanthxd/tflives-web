import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { ChatValidationError, reportGlobalChatMessage } from "@/modules/chat/service";
import { enforceRateLimit } from "@/infrastructure/rate-limit/service";

export async function POST(request: Request) {
  const user = await getCurrentAuthUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const limited = await enforceRateLimit("chat-report", user.id);
  if (limited) return limited;
  try {
    const body = await request.json();
    if (typeof body.messageId !== "string" || typeof body.reason !== "string") {
      return NextResponse.json({ error: "Reporte inválido" }, { status: 400 });
    }
    await reportGlobalChatMessage(
      user.id,
      body.messageId,
      body.reason,
      typeof body.details === "string" ? body.details : undefined,
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof ChatValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al enviar el reporte" }, { status: 500 });
  }
}
