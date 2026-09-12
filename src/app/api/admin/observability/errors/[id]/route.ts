import { NextResponse } from "next/server";
import { Prisma, type ApplicationErrorStatus } from "@prisma/client";
import { updateApplicationErrorStatus } from "@/modules/analytics/service";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";

const STATUSES = new Set<ApplicationErrorStatus>(["OPEN", "RESOLVED", "IGNORED"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSection("analytics");
    const body = await request.json().catch(() => null);
    const status = body && typeof body.status === "string" ? body.status as ApplicationErrorStatus : null;
    if (!status || !STATUSES.has(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const { id } = await params;
    return NextResponse.json({ error: await updateApplicationErrorStatus(id, status) });
  } catch (error) {
    if (error instanceof AdminGuardError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("Unable to update application error", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Unable to update application error" }, { status: 500 });
  }
}
