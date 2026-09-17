import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { MessagingError, listInbox, startOrGetDirectConversation } from "@/modules/messaging/service";

import { targetInput } from "@/modules/social/validation";

async function requireUser() {
  const authUser = await getCurrentAuthUser();
  return authUser;
}

export async function GET() {
  const authUser = await requireUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const inbox = await listInbox(authUser.id);
  return NextResponse.json(inbox);
}

export async function POST(request: Request) {
  const authUser = await requireUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = targetInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { username } = parsed.data;

  try {
    const conversation = await startOrGetDirectConversation(authUser.id, username);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    if (error instanceof MessagingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
