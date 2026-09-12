import { NextResponse } from "next/server";
import { listApplicationErrors } from "@/modules/analytics/service";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";

export async function GET() {
  try {
    await requireAdminSection("analytics");
    return NextResponse.json({ errors: await listApplicationErrors() });
  } catch (error) {
    if (error instanceof AdminGuardError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Unable to load application errors", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Unable to load application errors" }, { status: 500 });
  }
}
