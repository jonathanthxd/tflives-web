import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/auth/server";
import { MessagingError, getConversation, markConversationRead, sendMessage } from "@/modules/messaging/service";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  return authUser;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await requireUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  try {
    const { conversation, myParticipant } = await getConversation(id, authUser.id);
    if (myParticipant.status === "ACTIVE") {
      await markConversationRead(id, authUser.id);
    }
    return NextResponse.json({ conversation, myParticipant });
  } catch (error) {
    if (error instanceof MessagingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await requireUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { content } = await request.json().catch(() => ({}));
  if (typeof content !== "string") return NextResponse.json({ error: "Falta contenido" }, { status: 400 });

  try {
    const message = await sendMessage(id, authUser.id, content);
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof MessagingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
