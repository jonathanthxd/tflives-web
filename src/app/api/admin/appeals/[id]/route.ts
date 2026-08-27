import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { resolveAppeal, AppealError } from "@/modules/administration/appeals";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await requireAdminSection("moderation");
    const body = await request.json();
    const decision = body.decision;
    if (decision !== "approve" && decision !== "deny") {
      return NextResponse.json({ error: "Decisión inválida" }, { status: 400 });
    }
    const note = typeof body.note === "string" ? body.note : "";

    const appeal = await resolveAppeal(userId, id, decision, note);
    return NextResponse.json({ appeal }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof AppealError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al resolver la apelación" }, { status: 500 });
  }
}
