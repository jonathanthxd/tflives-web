import { NextResponse } from "next/server";
import { listUserAchievements, AchievementError } from "@/modules/achievements/service";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { getPublicProgressionProfile } from "@/modules/progression/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  if (!username) return NextResponse.json({ error: "Falta username" }, { status: 400 });

  try {
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
    const [achievements, progression] = await Promise.all([
      listUserAchievements(username),
      getPublicProgressionProfile(target.id),
    ]);
    return NextResponse.json({ achievements, progression }, { status: 200 });
  } catch (error) {
    if (error instanceof AchievementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener los logros" }, { status: 500 });
  }
}
