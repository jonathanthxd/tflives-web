import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { updateAchievement, deleteAchievement, AchievementError } from "@/modules/achievements/service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await requireAdminSection("achievements");
    const body = await request.json();

    const achievement = await updateAchievement(userId, id, {
      name: typeof body.name === "string" ? body.name : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      iconKey: typeof body.iconKey === "string" ? body.iconKey : undefined,
      order: typeof body.order === "number" ? body.order : undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
    });
    return NextResponse.json({ achievement }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof AchievementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar el logro" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await requireAdminSection("achievements");
    await deleteAchievement(userId, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof AchievementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar el logro" }, { status: 500 });
  }
}
