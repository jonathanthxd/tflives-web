import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { listAllAchievements, createAchievement, AchievementError } from "@/modules/achievements/service";

export async function GET() {
  try {
    await requireAdminSection("achievements");
    const achievements = await listAllAchievements();
    return NextResponse.json({ achievements }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener los logros" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("achievements");
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "invalid" }, { status: 400 });

    const achievement = await createAchievement(userId, {
      name: typeof body.name === "string" ? body.name : "",
      description: typeof body.description === "string" ? body.description : "",
      nameEn: typeof body.nameEn === "string" || body.nameEn === null ? body.nameEn : undefined,
      descriptionEn: typeof body.descriptionEn === "string" || body.descriptionEn === null ? body.descriptionEn : undefined,
      iconKey: typeof body.iconKey === "string" ? body.iconKey : "",
      order: typeof body.order === "number" ? body.order : 0,
      active: typeof body.active === "boolean" ? body.active : true,
      unlockMode: body.unlockMode === "AUTOMATIC" ? "AUTOMATIC" : "MANUAL",
      trigger: typeof body.trigger === "string" ? body.trigger : null,
      triggerValue: typeof body.triggerValue === "number" ? body.triggerValue : null,
      coinReward: typeof body.coinReward === "number" ? body.coinReward : undefined,
    });
    return NextResponse.json({ achievement }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof AchievementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al crear el logro" }, { status: 500 });
  }
}
