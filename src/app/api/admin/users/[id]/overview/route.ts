import { NextResponse } from "next/server";
import { AdminGuardError, requireAdminSection } from "@/modules/administration/api-guard";
import { AdminPlatformError, getAdminUserOverview } from "@/modules/administration/platform-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSection("users");
    const { id } = await params;
    return NextResponse.json(await getAdminUserOverview(id));
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof AdminPlatformError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Unable to load the user overview" }, { status: 500 });
  }
}
