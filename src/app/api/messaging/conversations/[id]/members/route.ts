import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { addGroupMember, closeGroup, MessagingError, leaveConversation, removeGroupMember } from "@/modules/messaging/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const { username } = await request.json().catch(() => ({}));
  if (typeof username !== "string") return NextResponse.json({ error: "Falta username" }, { status: 400 });
  try {
    const participant = await addGroupMember(id, authUser.id, username);
    return NextResponse.json({ participant }, { status: 201 });
  } catch (error) {
    if (error instanceof MessagingError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const { action } = await request.json().catch(() => ({}));
  if (action !== "close") return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  try {
    await closeGroup(id, authUser.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MessagingError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { targetUserId } = await request.json().catch(() => ({}));

  try {
    if (targetUserId && targetUserId !== authUser.id) {
      await removeGroupMember(id, authUser.id, targetUserId);
    } else {
      await leaveConversation(id, authUser.id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MessagingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
