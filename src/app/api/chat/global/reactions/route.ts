import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { ChatValidationError, toggleGlobalReaction } from "@/modules/chat/service";

export async function POST(request: Request) {
  const user = await getCurrentAuthUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body.messageId !== "string") {
      return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
    }
    const result = await toggleGlobalReaction(user.id, body.messageId, body.emoji);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ChatValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al reaccionar" }, { status: 500 });
  }
}
