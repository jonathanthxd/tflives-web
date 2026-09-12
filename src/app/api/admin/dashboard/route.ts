import { NextResponse } from "next/server";
import { AdminGuardError, requireAdminSection } from "@/modules/administration/api-guard";
import { getAdminDashboardSummary } from "@/modules/administration/platform-service";

export async function GET() {
  try {
    const { role } = await requireAdminSection("dashboard");
    return NextResponse.json(await getAdminDashboardSummary(role));
  } catch (error) {
    if (error instanceof AdminGuardError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Unable to load the admin summary" }, { status: 500 });
  }
}
