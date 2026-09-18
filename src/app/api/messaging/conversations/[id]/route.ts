import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { MessagingError, getConversation, markConversationRead, sendMessage } from "@/modules/messaging/service";
import { captureApplicationError } from "@/modules/analytics/service";
import { enforceRateLimit } from "@/infrastructure/rate-limit/service";

async function requireUser() {
  const authUser = await getCurrentAuthUser();
  return authUser;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await requireUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const query = new URL(request.url).searchParams;
  const parsedLimit = Number(query.get("limit") ?? 50);

  try {
    const { conversation, myParticipant, nextCursor, incremental } = await getConversation(id, authUser.id, {
      cursor: query.get("cursor"),
      after: query.get("after"),
      limit: Number.isFinite(parsedLimit) ? parsedLimit : 50,
    });
    if (myParticipant.status === "ACTIVE" && !query.get("after") && !query.get("cursor")) {
      await markConversationRead(id, authUser.id);
    }
    return NextResponse.json({ conversation, myParticipant, nextCursor, incremental });
  } catch (error) {
    if (error instanceof MessagingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    await captureApplicationError({ area: "messaging:conversation", error, status: 500 });
    throw error;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await requireUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const limited = await enforceRateLimit("messaging-send", authUser.id);
  if (limited) return limited;

  const { id } = await params;
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Payload inválido" }, { status: 400 });

  try {
    const message = await sendMessage(id, authUser.id, payload);
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof MessagingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    await captureApplicationError({ area: "messaging:send", error, status: 500 });
    throw error;
  }
}
