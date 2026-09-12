import { Activity, CircleDollarSign, MessageCircleMore, ShieldAlert, Sparkles, Users, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ANALYTICS_RANGES, getAdminAnalytics, isAnalyticsRange, listApplicationErrors } from "@/modules/analytics/service";
import { requireSectionPage } from "@/modules/administration/page-guard";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";
import { StatusBadge } from "@/modules/administration/components/ui/status-badge";
import { ErrorManager } from "@/modules/analytics/components/error-manager";

export const dynamic = "force-dynamic";

type Metric = { value: number; previous: number; delta: number; percent: number | null };

function MetricCard({ label, metric, locale }: { label: string; metric: Metric; locale: string }) {
  const direction = metric.delta > 0 ? "+" : "";
  const change = metric.percent === null ? "—" : `${direction}${metric.percent}%`;
  return <div className="rounded-2xl border border-primary/10 bg-card/25 p-4"><p className="font-mono text-2xl font-medium tabular-nums text-foreground">{metric.value.toLocaleString(locale)}</p><p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{label}</p><p className="mt-2 text-xs text-muted-foreground" aria-label={`${metric.previous} previous`}>{change} · {direction}{metric.delta.toLocaleString(locale)}</p></div>;
}

function Section({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return <section aria-label={title}><div className="mb-3 flex items-center gap-2"><Icon className="h-4 w-4 text-primary" strokeWidth={1.75} /><h2 className="font-display text-lg font-semibold text-foreground">{title}</h2></div>{children}</section>;
}

export default async function AnalyticsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ range?: string }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  await requireSectionPage("analytics", locale);
  const range = isAnalyticsRange(query.range) ? query.range : "30d";
  const [summary, errors, t] = await Promise.all([getAdminAnalytics(range), listApplicationErrors(), getTranslations({ locale, namespace: "Analytics" })]);
  const errorEntries = errors.map((error) => ({ ...error, firstSeenAt: error.firstSeenAt.toISOString(), lastSeenAt: error.lastSeenAt.toISOString() }));

  return <div className="min-w-0 space-y-10">
    <PageHeader icon={SECTION_ICONS.analytics} title={t("title")} description={t("description")} />
    <nav aria-label={t("rangeLabel")} className="flex flex-wrap gap-2">
      {ANALYTICS_RANGES.map((key) => <Link key={key} href={`/admin/analytics?range=${key}`} aria-current={key === range ? "page" : undefined} className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${key === range ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-card/30 text-muted-foreground hover:bg-primary/5 hover:text-foreground"}`}>{t(`range${key}`)}</Link>)}
    </nav>

    <Section title={t("overview")} icon={Users}><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"><MetricCard label={t("dau")} metric={summary.users.dau} locale={locale} /><MetricCard label={t("wau")} metric={summary.users.wau} locale={locale} /><MetricCard label={t("mau")} metric={summary.users.mau} locale={locale} /><MetricCard label={t("activeUsers", { days: summary.range.days })} metric={summary.users.active} locale={locale} /><MetricCard label={t("newUsers")} metric={summary.users.new} locale={locale} /><div className="rounded-2xl border border-primary/10 bg-card/25 p-4"><p className="font-mono text-2xl font-medium tabular-nums text-foreground">{summary.users.total.toLocaleString(locale)}</p><p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{t("totalUsers")}</p></div></div><p className="mt-3 text-xs text-muted-foreground">{t("activityDefinition")}</p></Section>

    <Section title={t("community")} icon={MessageCircleMore}><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard label={t("messages")} metric={summary.community.messages} locale={locale} /><MetricCard label={t("dms")} metric={summary.community.directMessages} locale={locale} /><MetricCard label={t("follows")} metric={summary.community.follows} locale={locale} /><MetricCard label={t("likes")} metric={summary.community.likes} locale={locale} /></div></Section>

    <Section title={t("progression")} icon={Sparkles}><div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><MetricCard label={t("levelUps")} metric={summary.progression.levelUps} locale={locale} /><MetricCard label={t("achievements")} metric={summary.progression.achievements} locale={locale} /><MetricCard label={t("profilesCompleted")} metric={summary.progression.profileCompleted} locale={locale} /></div></Section>

    <Section title={t("economy")} icon={CircleDollarSign}><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard label={t("coinsEmitted")} metric={summary.economy.emitted} locale={locale} /><MetricCard label={t("coinsSpent")} metric={summary.economy.spent} locale={locale} /><MetricCard label={t("cosmeticPurchases")} metric={summary.cosmetics.purchases} locale={locale} /><MetricCard label={t("cosmeticsEquipped")} metric={summary.cosmetics.equips} locale={locale} /></div><div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground"><span>{t("circulatingCoins", { count: summary.economy.circulating.toLocaleString(locale) })}</span><span>{t("activeCosmetics", { count: summary.cosmetics.active })}</span></div>{summary.cosmetics.top.length > 0 && <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label={t("topCosmetics")}>{summary.cosmetics.top.map((cosmetic) => <li key={cosmetic.id} className="rounded-xl border border-primary/10 bg-card/20 px-3 py-2 text-sm"><span className="block truncate font-medium text-foreground">{locale === "en" ? cosmetic.nameEn : cosmetic.name}</span><span className="text-xs text-muted-foreground">{t("purchases", { count: cosmetic.purchases })}</span></li>)}</ol>}</Section>

    <div className="grid gap-8 xl:grid-cols-2"><Section title={t("creators")} icon={SECTION_ICONS.creators}><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><MetricCard label={t("creatorApplications")} metric={summary.creators.applications} locale={locale} /><MetricCard label={t("creatorApprovals")} metric={summary.creators.approvals} locale={locale} /><div className="rounded-2xl border border-primary/10 bg-card/25 p-4"><p className="font-mono text-2xl font-medium text-foreground">{summary.creators.active.toLocaleString(locale)}</p><p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{t("activeCreators")}</p></div><div className="rounded-2xl border border-primary/10 bg-card/25 p-4"><p className="font-mono text-2xl font-medium text-foreground">{summary.creators.featured.toLocaleString(locale)}</p><p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{t("featuredCreators")}</p></div></div></Section><Section title={t("onboarding")} icon={Activity}><ol className="space-y-3"><li className="flex items-center justify-between rounded-xl border border-primary/10 px-4 py-3 text-sm"><span>{t("funnelAccounts")}</span><strong className="font-mono">{summary.funnels.onboarding.accounts.toLocaleString(locale)}</strong></li><li className="flex items-center justify-between rounded-xl border border-primary/10 px-4 py-3 text-sm"><span>{t("funnelProfiles")}</span><strong className="font-mono">{summary.funnels.onboarding.profilesCompleted.toLocaleString(locale)}</strong></li><li className="flex items-center justify-between rounded-xl border border-primary/10 px-4 py-3 text-sm"><span>{t("funnelSocial")}</span><strong className="font-mono">{summary.funnels.onboarding.socialInteraction.toLocaleString(locale)}</strong></li></ol><p className="mt-3 text-xs text-muted-foreground">{t("funnelNote")}</p></Section></div>

    <Section title={t("technicalHealth")} icon={ShieldAlert}><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-4"><p className="font-mono text-2xl font-medium text-foreground">{summary.health.errorsLast24h}</p><p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{t("errorsLast24h")}</p></div><div className="rounded-2xl border border-primary/10 bg-card/25 p-4"><p className="font-mono text-2xl font-medium text-foreground">{summary.health.openErrors}</p><p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{t("openErrors")}</p></div><div className="rounded-2xl border border-primary/10 bg-card/25 p-4"><p className="font-mono text-2xl font-medium text-foreground">{summary.health.significantEventsLast24h}</p><p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{t("significantEventsLast24h")}</p></div></div><div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">{summary.health.lastError ? <span>{t("lastError", { area: summary.health.lastError.area, date: new Date(summary.health.lastError.lastSeenAt).toLocaleString(locale) })}</span> : <StatusBadge tone="success">{t("noRecentError")}</StatusBadge>}{summary.health.lastEvent && <span>{t("lastAnalyticsEvent", { type: summary.health.lastEvent.type, date: new Date(summary.health.lastEvent.createdAt).toLocaleString(locale) })}</span>}</div><div className="mt-5"><h3 className="mb-3 font-display text-base font-semibold text-foreground">{t("recentErrors")}</h3><ErrorManager initialErrors={errorEntries} locale={locale} /></div></Section>
  </div>;
}
