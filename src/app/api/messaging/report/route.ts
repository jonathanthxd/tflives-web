import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { MessagingError, report } from "@/modules/messaging/service";

export async function POST(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { targetType, targetId, reason } = await request.json().catch(() => ({}));
  if (!targetType || !targetId || !reason) {
    return NextResponse.json({ error: "Faltan datos del reporte" }, { status: 400 });
  }

  try {
    await report(authUser.id, targetType, targetId, reason);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof MessagingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
