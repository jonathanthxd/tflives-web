import { requireSectionPage } from "@/modules/administration/page-guard";
import { prisma } from "@/infrastructure/database/prisma";
import ReportsManager from "@/modules/administration/components/reports-manager";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireSectionPage("reports", locale);

  const reports = await prisma.report.findMany({
    include: {
      reporter: { select: { id: true, username: true, displayName: true, name: true } },
      reviewedBy: { select: { id: true, username: true, displayName: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        icon={SECTION_ICONS.reports}
        title="Reportes"
        description="Reportes de conversaciones y otros contenidos. Marcá cada uno como revisado o descartado una vez resuelto."
      />
      <ReportsManager
        initialReports={reports.map((r) => ({
          id: r.id,
          targetType: r.targetType,
          targetId: r.targetId,
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          reporter: r.reporter,
          reviewedBy: r.reviewedBy,
        }))}
      />
    </div>
  );
}
