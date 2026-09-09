import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { MessagingError, leaveConversation, removeGroupMember } from "@/modules/messaging/service";

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
