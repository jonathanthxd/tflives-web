import { requireSectionPage } from "@/modules/administration/page-guard";
import { prisma } from "@/infrastructure/database/prisma";
import { Users, Newspaper, MessagesSquare, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireSectionPage("analytics", locale);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersLast7Days,
    newUsersLast30Days,
    usersByRole,
    totalPosts,
    publishedPosts,
    archivedPosts,
    totalFriendships,
    totalMessages,
    messagesLast7Days,
    openReports,
    activeBans,
    activeMutes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.post.count({ where: { archived: true } }),
    prisma.friendship.count({ where: { status: "ACCEPTED" } }),
    prisma.directMessage.count(),
    prisma.directMessage.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.userSanction.count({
      where: { type: { in: ["BAN", "SUSPEND"] }, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    }),
    prisma.userSanction.count({
      where: { type: "MUTE", revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    }),
  ]);

  const roleCounts = Object.fromEntries(usersByRole.map((r) => [r.role, r._count.role]));

  const sections = [
    {
      title: "Usuarios",
      icon: Users,
      stats: [
        { label: "Total", value: totalUsers },
        { label: "Nuevos (7 días)", value: newUsersLast7Days },
        { label: "Nuevos (30 días)", value: newUsersLast30Days },
        { label: "Moderadores", value: roleCounts.MOD ?? 0 },
        { label: "Administradores", value: roleCounts.ADMIN ?? 0 },
      ],
    },
    {
      title: "Contenido",
      icon: Newspaper,
      stats: [
        { label: "Posts totales", value: totalPosts },
        { label: "Publicados", value: publishedPosts },
        { label: "Borradores", value: totalPosts - publishedPosts },
        { label: "Archivados", value: archivedPosts },
      ],
    },
    {
      title: "Actividad social",
      icon: MessagesSquare,
      stats: [
        { label: "Amistades activas", value: totalFriendships },
        { label: "Mensajes totales", value: totalMessages },
        { label: "Mensajes (7 días)", value: messagesLast7Days },
      ],
    },
    {
      title: "Moderación",
      icon: ShieldAlert,
      stats: [
        { label: "Reportes abiertos", value: openReports },
        { label: "Bans/suspensiones activas", value: activeBans },
        { label: "Silencios activos", value: activeMutes },
      ],
    },
  ];

  return (
    <div>
      <PageHeader
        icon={SECTION_ICONS.analytics}
        title="Analítica"
        description="Números reales de actividad. Sin gráficos avanzados todavía."
      />

      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="mb-4 flex items-center gap-2">
              <section.icon className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.75} />
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50">
                {section.title}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {section.stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-primary/10 bg-card/20 p-5">
                  <div className="font-mono text-2xl font-medium tabular-nums text-foreground">{stat.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
