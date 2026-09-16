import { requireSectionPage } from "@/modules/administration/page-guard";
import { prisma } from "@/infrastructure/database/prisma";
import ReportsManager from "@/modules/administration/components/reports-manager";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const instant = false;

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
  const globalIds = reports
    .filter((report) => report.targetType === "GLOBAL_CHAT_MESSAGE")
    .map((report) => report.targetId);
  const directIds = reports
    .filter((report) => report.targetType === "DIRECT_MESSAGE")
    .map((report) => report.targetId);
  const [globalMessages, directMessages] = await Promise.all([
    globalIds.length
      ? prisma.globalChatMessage.findMany({
          where: { id: { in: globalIds } },
          select: {
            id: true, content: true, deletedAt: true,
            author: { select: { id: true, username: true, displayName: true, name: true } },
          },
        })
      : [],
    directIds.length
      ? prisma.directMessage.findMany({
          where: { id: { in: directIds } },
          select: {
            id: true, content: true, deletedAt: true,
            sender: { select: { id: true, username: true, displayName: true, name: true } },
          },
        })
      : [],
  ]);
  const globalById = new Map(globalMessages.map((message) => [message.id, message]));
  const directById = new Map(directMessages.map((message) => [message.id, message]));

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
          details: r.details,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          reporter: r.reporter,
          reviewedBy: r.reviewedBy,
          targetContext: r.targetType === "GLOBAL_CHAT_MESSAGE"
            ? (() => {
                const message = globalById.get(r.targetId);
                return message ? { content: message.content, deletedAt: message.deletedAt?.toISOString() ?? null, author: message.author } : null;
              })()
            : r.targetType === "DIRECT_MESSAGE"
              ? (() => {
                  const message = directById.get(r.targetId);
                  return message ? { content: message.content, deletedAt: message.deletedAt?.toISOString() ?? null, author: message.sender } : null;
                })()
              : null,
        }))}
      />
    </div>
  );
}
