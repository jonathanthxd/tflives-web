import { NextResponse } from "next/server";
import { AdminGuardError, requireAdminSection } from "@/modules/administration/api-guard";
import { searchAdminResources } from "@/modules/administration/platform-service";

export async function GET(request: Request) {
  try {
    const { role } = await requireAdminSection("dashboard");
    const query = new URL(request.url).searchParams.get("q") ?? "";
    return NextResponse.json(await searchAdminResources(role, query));
  } catch (error) {
    if (error instanceof AdminGuardError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Unable to search administration" }, { status: 500 });
  }
}
