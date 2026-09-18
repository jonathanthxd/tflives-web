import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import {
  ChatValidationError,
  getGlobalChatUnreadCount,
  listGlobalMessages,
  markGlobalChatRead,
  sendGlobalMessage,
} from "@/modules/chat/service";
import { captureApplicationError } from "@/modules/analytics/service";
import { enforceRateLimit } from "@/infrastructure/rate-limit/service";

async function errorResponse(error: unknown) {
  if (error instanceof ChatValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  await captureApplicationError({ area: "chat:global", error, status: 500 });
  console.error(error);
  return NextResponse.json({ error: "Error de chat" }, { status: 500 });
}

export async function GET(request: Request) {
  const user = await getCurrentAuthUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const query = new URL(request.url).searchParams;
  if (query.get("meta") === "unread") {
    return NextResponse.json({ unreadCount: await getGlobalChatUnreadCount(user.id) });
  }
  const parsedLimit = Number(query.get("limit") ?? 40);
  try {
    const [page, unreadCount] = await Promise.all([
      listGlobalMessages({
        userId: user.id,
        cursor: query.get("cursor"),
        after: query.get("after"),
        limit: Number.isFinite(parsedLimit) ? parsedLimit : 40,
      }),
      getGlobalChatUnreadCount(user.id),
    ]);
    return NextResponse.json({ ...page, unreadCount });
  } catch (error) {
    return await errorResponse(error);
  }
}

export async function POST(request: Request) {
  const user = await getCurrentAuthUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const limited = await enforceRateLimit("chat-global", user.id);
  if (limited) return limited;
  try {
    const message = await sendGlobalMessage(user.id, await request.json());
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return await errorResponse(error);
  }
}

export async function PATCH() {
  const user = await getCurrentAuthUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  await markGlobalChatRead(user.id);
  return NextResponse.json({ ok: true });
}
