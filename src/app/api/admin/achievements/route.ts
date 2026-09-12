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
    const body = await request.json();

    const achievement = await createAchievement(userId, {
      name: typeof body.name === "string" ? body.name : "",
      description: typeof body.description === "string" ? body.description : "",
      iconKey: typeof body.iconKey === "string" ? body.iconKey : "",
      order: typeof body.order === "number" ? body.order : 0,
      active: typeof body.active === "boolean" ? body.active : true,
      unlockMode: body.unlockMode === "AUTOMATIC" ? "AUTOMATIC" : "MANUAL",
      trigger: typeof body.trigger === "string" ? body.trigger : null,
      triggerValue: typeof body.triggerValue === "number" ? body.triggerValue : null,
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
