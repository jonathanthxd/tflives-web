import { NextResponse } from "next/server";
import { getAdminAnalytics } from "@/modules/analytics/service";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";

export async function GET(request: Request) {
  try {
    await requireAdminSection("analytics");
    const range = new URL(request.url).searchParams.get("range");
    return NextResponse.json(await getAdminAnalytics(range));
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unable to load analytics", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Unable to load analytics" }, { status: 500 });
  }
}
