import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { listUserActivity } from "@/modules/community/activity";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  if (!username) return NextResponse.json({ error: "Falta username" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const activity = await listUserActivity(user.id);
  return NextResponse.json({ activity }, { status: 200 });
}
