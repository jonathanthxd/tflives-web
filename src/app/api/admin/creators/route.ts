import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { listCreatorAdminData } from "@/modules/creators/service";

export async function GET() {
  try {
    await requireAdminSection("creators");
    return NextResponse.json(await listCreatorAdminData());
  } catch (error) {
    if (error instanceof AdminGuardError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
