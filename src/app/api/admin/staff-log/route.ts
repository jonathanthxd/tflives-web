import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { listAdminActionLog } from "@/modules/administration/action-log";

export async function GET(request: Request) {
  try {
    await requireAdminSection("staffLog");
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 300) : 100;

    const entries = await listAdminActionLog(limit);
    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener el registro de staff" }, { status: 500 });
  }
}
