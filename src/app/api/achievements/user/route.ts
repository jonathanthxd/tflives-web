import { NextResponse } from "next/server";
import { listUserAchievements, listUserObtainableAchievements, AchievementError } from "@/modules/achievements/service";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { getPublicProgressionProfile, reconcileProgressionAchievements } from "@/modules/progression/service";
import { evaluateAutomaticAchievements } from "@/modules/achievements/automatic";
import { ACHIEVEMENT_TRIGGER_KEYS } from "@/modules/achievements/triggers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const locale = searchParams.get("locale") === "en" ? "en" : "es";
  if (!username) return NextResponse.json({ error: "Falta username" }, { status: 400 });

  try {
    const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    let viewer = null;
    try {
      viewer = await getCurrentAuthUser();
    } catch {
      // Not logged in or session error — treat as anonymous viewer
    }

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
    // Achievements are reconciled from current server facts whenever the
    // achievement surface is requested. This makes pre-existing Google/Discord
    // links, verified email, profile completion, messages, friendships, XP, and
    // levels count even if they happened before a particular achievement shipped.
    await reconcileProgressionAchievements(target.id);
    await evaluateAutomaticAchievements(target.id, ACHIEVEMENT_TRIGGER_KEYS, "significant-per-trigger");

    const [achievements, obtainableAchievements, progression] = await Promise.all([
      listUserAchievements(username, locale),
      listUserObtainableAchievements(username, locale),
      getPublicProgressionProfile(target.id, locale),
    ]);
    return NextResponse.json({ achievements, obtainableAchievements, progression }, { status: 200 });
  } catch (error) {
    if (error instanceof AchievementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener los logros" }, { status: 500 });
  }
}
