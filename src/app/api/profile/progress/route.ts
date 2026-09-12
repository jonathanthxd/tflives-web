import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { getPublicProgressSummary } from "@/modules/progression/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  if (!username) return NextResponse.json({ error: "Falta username" }, { status: 400 });

  const [target, viewer] = await Promise.all([
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
    getCurrentAuthUser(),
  ]);
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  if (viewer && viewer.id !== target.id) {
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewer.id, blockedId: target.id },
          { blockerId: target.id, blockedId: viewer.id },
        ],
      },
      select: { id: true },
    });
    if (blocked) return NextResponse.json({ error: "Perfil no disponible" }, { status: 403 });
  }

  const progress = await getPublicProgressSummary(target.id);
  return NextResponse.json({ progress }, { status: 200 });
}
