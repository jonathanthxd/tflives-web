import { getTranslations } from "next-intl/server";
import { Activity, Flag, LayoutDashboard, Plus, Search, ShieldAlert, TriangleAlert, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireSectionPage } from "@/modules/administration/page-guard";
import { getAdminDashboardSummary } from "@/modules/administration/platform-service";
import { canAccessSection } from "@/modules/administration/permissions";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { StatCard } from "@/modules/administration/components/ui/stat-card";
import { EmptyState } from "@/modules/administration/components/ui/empty-state";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const instant = false;

function actorLabel(actor: { username: string | null; displayName: string | null; name: string | null } | null) {
  return actor?.displayName || actor?.name || actor?.username || "—";
}

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const guard = await requireSectionPage("dashboard", locale);
  const [summary, t] = await Promise.all([
    getAdminDashboardSummary(guard.role),
    getTranslations({ locale, namespace: "AdminPlatform" }),
  ]);
  const { counts } = summary;
  const stats = [
    { label: t("users"), value: counts.users, icon: Users, tone: "default" as const },
    { label: t("openReports"), value: counts.openReports, icon: Flag, tone: counts.openReports ? "danger" as const : "default" as const },
    { label: t("pendingAppeals"), value: counts.pendingAppeals, icon: ShieldAlert, tone: counts.pendingAppeals ? "warning" as const : "default" as const },
    ...(counts.activeCreators !== null ? [{ label: t("activeCreators"), value: counts.activeCreators, icon: SECTION_ICONS.creators, tone: "default" as const }] : []),
    ...(counts.activeCosmetics !== null ? [{ label: t("activeCosmetics"), value: counts.activeCosmetics, icon: SECTION_ICONS.cosmetics, tone: "default" as const }] : []),
    ...(counts.activePremium !== null ? [{ label: t("activePremium"), value: counts.activePremium, icon: SECTION_ICONS.cosmetics, tone: "default" as const }] : []),
    ...(counts.analytics ? [
      { label: t("activeUsers7d"), value: counts.analytics.activeUsers7d, icon: Activity, tone: "default" as const },
      { label: t("errorsLast24h"), value: counts.analytics.errorsLast24h, icon: TriangleAlert, tone: counts.analytics.errorsLast24h ? "danger" as const : "default" as const },
      { label: t("significantEventsLast24h"), value: counts.analytics.significantEventsLast24h, icon: Activity, tone: "default" as const },
    ] : []),
  ];
  const quickActions = [
    { id: "search", href: "/admin/users", icon: Search, visible: canAccessSection(guard.role, "users") },
    { id: "reports", href: "/admin/reports", icon: Flag, visible: canAccessSection(guard.role, "reports") },
    { id: "creators", href: "/admin/creators", icon: SECTION_ICONS.creators, visible: canAccessSection(guard.role, "creators") },
    { id: "content", href: "/admin/posts/new", icon: Plus, visible: canAccessSection(guard.role, "posts") },
    { id: "achievement", href: "/admin/achievements", icon: SECTION_ICONS.achievements, visible: canAccessSection(guard.role, "achievements") },
    { id: "cosmetic", href: "/admin/cosmeticos", icon: SECTION_ICONS.cosmetics, visible: canAccessSection(guard.role, "cosmetics") },
    { id: "wallet", href: "/admin/economia", icon: SECTION_ICONS.wallet, visible: canAccessSection(guard.role, "wallet") },
  ].filter((action) => action.visible);

  return (
    <div className="space-y-10">
      <PageHeader icon={LayoutDashboard} title={t("dashboardTitle")} description={t("dashboardDescription")} />
      <section aria-labelledby="admin-current-state">
        <h2 id="admin-current-state" className="sr-only">{t("currentState")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section aria-labelledby="admin-pending" className="rounded-2xl border border-primary/10 bg-card/25 p-5">
          <h2 id="admin-pending" className="font-display text-lg font-semibold text-foreground">{t("needsAttention")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("needsAttentionDescription")}</p>
          {summary.pending.length === 0 ? <div className="mt-5"><EmptyState icon={ShieldAlert} title={t("allCaughtUp")} description={t("allCaughtUpDescription")} /></div> : (
            <div className="mt-4 space-y-2">
              {summary.pending.map((item) => <Link key={item.id} href={item.href} className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-background/40 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"><span className="text-sm font-medium text-foreground">{t(`pending${item.id.charAt(0).toUpperCase()}${item.id.slice(1)}`)}</span><span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-xs text-primary">{item.count}</span></Link>)}
            </div>
          )}
        </section>

        <section aria-labelledby="admin-activity" className="rounded-2xl border border-primary/10 bg-card/25 p-5">
          <div className="flex items-center justify-between gap-3"><div><h2 id="admin-activity" className="font-display text-lg font-semibold text-foreground">{t("recentActivity")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("recentActivityDescription")}</p></div>{canAccessSection(guard.role, "staffLog") && <Link href="/admin/staff-log" className="text-sm font-medium text-primary hover:underline">{t("viewAudit")}</Link>}</div>
          {summary.recentActions.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-primary/15 px-4 py-5 text-sm text-muted-foreground">{canAccessSection(guard.role, "staffLog") ? t("noActivity") : t("activityRestricted")}</p> : (
            <ol className="mt-4 divide-y divide-primary/10">
              {summary.recentActions.map((entry) => <li key={entry.id} className="flex items-start justify-between gap-4 py-3 first:pt-0"><div className="min-w-0"><p className="truncate text-sm text-foreground"><span className="font-medium">{actorLabel(entry.actor)}</span><span className="text-muted-foreground"> · {entry.action.replaceAll(".", " · ")}</span></p>{entry.targetType && <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground/65">{entry.targetType}{entry.targetId ? ` · ${entry.targetId}` : ""}</p>}</div><time className="shrink-0 text-xs text-muted-foreground" dateTime={entry.createdAt.toISOString()}>{entry.createdAt.toLocaleDateString(locale)}</time></li>)}
            </ol>
          )}
        </section>
      </div>

      <section aria-labelledby="admin-quick-actions"><h2 id="admin-quick-actions" className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/60">{t("quickActions")}</h2><div className="mt-3 flex flex-wrap gap-2.5">{quickActions.map((action) => { const Icon = action.icon; return <Link key={action.id} href={action.href} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/40 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/10"><Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />{t(`quick${action.id.charAt(0).toUpperCase()}${action.id.slice(1)}`)}</Link>; })}</div></section>
    </div>
  );
}
