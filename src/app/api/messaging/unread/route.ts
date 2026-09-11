import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { getMessagingUnreadCount } from "@/modules/messaging/service";

export async function GET() {
  const user = await getCurrentAuthUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  return NextResponse.json({ unreadCount: await getMessagingUnreadCount(user.id) });
}
