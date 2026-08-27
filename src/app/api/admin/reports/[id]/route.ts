import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { logAdminAction } from "@/modules/administration/action-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await requireAdminSection("reports");
    const body = await request.json();
    const action = body.action;
    if (action !== "review" && action !== "dismiss") {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
    if (report.status !== "OPEN") {
      return NextResponse.json({ error: "Este reporte ya fue resuelto" }, { status: 409 });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        status: action === "review" ? "REVIEWED" : "DISMISSED",
        reviewedById: userId,
        reviewedAt: new Date(),
      },
    });

    await logAdminAction({
      actorId: userId,
      action: action === "review" ? "report.review" : "report.dismiss",
      targetType: "Report",
      targetId: id,
      metadata: { reportTargetType: report.targetType, reportTargetId: report.targetId },
    });

    return NextResponse.json({ report: updated }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar el reporte" }, { status: 500 });
  }
}
