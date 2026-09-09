import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { MessagingError, block, unblock } from "@/modules/messaging/service";

export async function POST(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { username } = await request.json().catch(() => ({}));
  if (!username) return NextResponse.json({ error: "Falta username" }, { status: 400 });

  try {
    await block(authUser.id, username);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof MessagingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { username } = await request.json().catch(() => ({}));
  if (!username) return NextResponse.json({ error: "Falta username" }, { status: 400 });

  await unblock(authUser.id, username);
  return NextResponse.json({ ok: true });
}
