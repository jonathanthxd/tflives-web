import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { awardAchievement, revokeAchievement, AchievementError } from "@/modules/achievements/service";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("achievements");
    const body = await request.json();

    if (typeof body.username !== "string" || !body.username.trim()) {
      return NextResponse.json({ error: "Falta el username" }, { status: 400 });
    }
    if (typeof body.achievementId !== "string" || !body.achievementId) {
      return NextResponse.json({ error: "Falta el logro" }, { status: 400 });
    }

    const award = await awardAchievement(userId, body.username.trim(), body.achievementId);
    return NextResponse.json({ award }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof AchievementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al otorgar el logro" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await requireAdminSection("achievements");
    const body = await request.json();

    if (typeof body.targetUserId !== "string" || !body.targetUserId) {
      return NextResponse.json({ error: "Falta el usuario" }, { status: 400 });
    }
    if (typeof body.achievementId !== "string" || !body.achievementId) {
      return NextResponse.json({ error: "Falta el logro" }, { status: 400 });
    }

    await revokeAchievement(userId, body.targetUserId, body.achievementId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof AchievementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al revocar el logro" }, { status: 500 });
  }
}
