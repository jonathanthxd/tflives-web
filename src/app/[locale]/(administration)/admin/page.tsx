import { prisma } from "@/infrastructure/database/prisma";
import { Link } from "@/i18n/navigation";
import { LayoutDashboard, Plus, Gamepad2, Flag } from "lucide-react";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { StatCard } from "@/modules/administration/components/ui/stat-card";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const now = new Date();
  const [
    postsCount,
    usersCount,
    modalitiesCount,
    friendshipsCount,
    messagesCount,
    openReports,
    activeSanctions,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.user.count(),
    prisma.modality.count(),
    prisma.friendship.count({ where: { status: "ACCEPTED" } }),
    prisma.directMessage.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.userSanction.count({
      where: { revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    }),
  ]);

  const stats = [
    { label: "Posts", value: postsCount, icon: SECTION_ICONS.posts, tone: "default" as const },
    { label: "Usuarios", value: usersCount, icon: SECTION_ICONS.users, tone: "default" as const },
    { label: "Modalidades", value: modalitiesCount, icon: SECTION_ICONS.modalities, tone: "default" as const },
    { label: "Amistades", value: friendshipsCount, icon: SECTION_ICONS.dashboard, tone: "success" as const },
    { label: "Mensajes", value: messagesCount, icon: SECTION_ICONS.dashboard, tone: "success" as const },
    { label: "Reportes abiertos", value: openReports, icon: SECTION_ICONS.reports, tone: openReports > 0 ? ("danger" as const) : ("default" as const) },
    { label: "Sanciones activas", value: activeSanctions, icon: SECTION_ICONS.moderation, tone: activeSanctions > 0 ? ("warning" as const) : ("default" as const) },
  ];

  return (
    <div>
      <PageHeader icon={LayoutDashboard} title="Dashboard" description="Estado general de la comunidad, en vivo." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} tone={stat.tone} />
        ))}
      </div>

      <div className="mt-12">
        <p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50">
          Acciones rápidas
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary/20"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nuevo post
          </Link>
          <Link
            href="/admin/modalities"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/30 px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:border-primary/30 hover:text-primary"
          >
            <Gamepad2 className="h-4 w-4" strokeWidth={1.75} />
            Gestionar modalidades
          </Link>
          {openReports > 0 && (
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-500/20 dark:text-red-400"
            >
              <Flag className="h-4 w-4" strokeWidth={1.75} />
              Revisar {openReports} reporte{openReports === 1 ? "" : "s"} pendiente{openReports === 1 ? "" : "s"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
