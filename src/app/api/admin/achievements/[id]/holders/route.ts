import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { listAchievementHolders } from "@/modules/achievements/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAdminSection("achievements");
    const holders = await listAchievementHolders(id);
    return NextResponse.json({ holders }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener los usuarios" }, { status: 500 });
  }
}
