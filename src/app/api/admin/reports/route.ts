import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { ReportStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireAdminSection("reports");

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam && (["OPEN", "REVIEWED", "DISMISSED"] as const).includes(statusParam as ReportStatus)
        ? (statusParam as ReportStatus)
        : undefined;
    const targetType = searchParams.get("targetType") ?? undefined;

    const reports = await prisma.report.findMany({
      where: { ...(status ? { status } : {}), ...(targetType ? { targetType } : {}) },
      include: {
        reporter: { select: { id: true, username: true, displayName: true, name: true } },
        reviewedBy: { select: { id: true, username: true, displayName: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ reports }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener los reportes" }, { status: 500 });
  }
}
