import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { MessagingError, toggleDirectMessageReaction } from "@/modules/messaging/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAuthUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  try {
    const { emoji } = await request.json();
    return NextResponse.json(await toggleDirectMessageReaction(user.id, id, emoji));
  } catch (error) {
    if (error instanceof MessagingError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Error al reaccionar" }, { status: 500 });
  }
}
