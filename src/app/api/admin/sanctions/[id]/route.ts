import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { revokeSanction, SanctionError } from "@/modules/administration/sanctions";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await requireAdminSection("moderation");
    const sanction = await revokeSanction(userId, id);
    return NextResponse.json({ sanction }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof SanctionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al revocar la sanción" }, { status: 500 });
  }
}
