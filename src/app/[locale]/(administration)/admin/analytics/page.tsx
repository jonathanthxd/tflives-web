import {
  Activity,
  CircleDollarSign,
  HeartPulse,
  MessageCircleMore,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ANALYTICS_RANGES, getAdminAnalytics, isAnalyticsRange, listApplicationErrors } from "@/modules/analytics/service";
import { requireSectionPage } from "@/modules/administration/page-guard";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";
import { StatusBadge } from "@/modules/administration/components/ui/status-badge";
import { ErrorManager } from "@/modules/analytics/components/error-manager";
import {
  ComparisonBars,
  EconomyFlow,
  EngagementRhythm,
  FunnelVisual,
  HealthVisual,
  MetricTrend,
  ProgramVisual,
  QuickInsight,
  RankedBars,
  VisualPanel,
  type AnalyticsMetric,
} from "@/modules/analytics/components/analytics-visuals";

export const dynamic = "force-dynamic";

type Metric = AnalyticsMetric;

function MetricCard({ label, metric, locale }: { label: string; metric: Metric; locale: string }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-card/40 p-4 transition-colors hover:border-primary/20">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-2xl font-medium tabular-nums text-foreground">{metric.value.toLocaleString(locale)}</p>
        <MetricTrend metric={metric} locale={locale} />
      </div>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{label}</p>
      <p className="mt-2 text-[11px] text-muted-foreground" aria-label={`${metric.previous} previous`}>
        {metric.delta > 0 ? "+" : ""}{metric.delta.toLocaleString(locale)}
      </p>
    </div>
  );
}

function StaticMetricCard({ label, value, locale }: { label: string; value: number; locale: string }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-card/40 p-4">
      <p className="font-mono text-2xl font-medium tabular-nums text-foreground">{value.toLocaleString(locale)}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{label}</p>
    </div>
  );
}

function Section({ title, icon: Icon, description, children }: { title: string; icon: LucideIcon; description?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title}>
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function combineMetrics(metrics: Metric[]): Metric {
  const value = metrics.reduce((total, metric) => total + metric.value, 0);
  const previous = metrics.reduce((total, metric) => total + metric.previous, 0);
  const delta = value - previous;
  return {
    value,
    previous,
    delta,
    percent: previous === 0 ? null : Math.round((delta / previous) * 100),
  };
}

export default async function AnalyticsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ range?: string }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  await requireSectionPage("analytics", locale);
  const range = isAnalyticsRange(query.range) ? query.range : "30d";
  const [summary, errors, t] = await Promise.all([
    getAdminAnalytics(range),
    listApplicationErrors(),
    getTranslations({ locale, namespace: "Analytics" }),
  ]);
  const errorEntries = errors.map((error) => ({ ...error, firstSeenAt: error.firstSeenAt.toISOString(), lastSeenAt: error.lastSeenAt.toISOString() }));

  const communityActivity = combineMetrics([
    summary.community.messages,
    summary.community.directMessages,
    summary.community.follows,
    summary.community.likes,
  ]);
  const economyNet = summary.economy.emitted.value - summary.economy.spent.value;
  const healthNeedsAttention = summary.health.errorsLast24h > 0 || summary.health.openErrors > 0;
  const activityTitle = communityActivity.previous === 0
    ? t("activityNoBaseline", { count: communityActivity.value })
    : communityActivity.delta > 0
      ? t("activityUp", { percent: Math.abs(communityActivity.percent ?? 0) })
      : communityActivity.delta < 0
        ? t("activityDown", { percent: Math.abs(communityActivity.percent ?? 0) })
        : t("activityFlat");
  const growthTitle = summary.users.new.previous === 0
    ? t("growthNoBaseline", { count: summary.users.new.value })
    : summary.users.new.delta > 0
      ? t("growthUp", { percent: Math.abs(summary.users.new.percent ?? 0) })
      : summary.users.new.delta < 0
        ? t("growthDown", { percent: Math.abs(summary.users.new.percent ?? 0) })
        : t("growthFlat");

  return (
    <div className="min-w-0 space-y-10">
      <PageHeader icon={SECTION_ICONS.analytics} title={t("title")} description={t("description")} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label={t("rangeLabel")} className="flex flex-wrap gap-2">
          {ANALYTICS_RANGES.map((key) => (
            <Link
              key={key}
              href={`/admin/analytics?range=${key}`}
              aria-current={key === range ? "page" : undefined}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${key === range ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-card/30 text-muted-foreground hover:bg-primary/5 hover:text-foreground"}`}
            >
              {t(`range${key}`)}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground">{t("compareWithPrevious", { days: summary.range.days })}</p>
      </div>

      <Section title={t("quickRead")} icon={HeartPulse} description={t("quickReadDescription")}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <QuickInsight
            icon={Activity}
            eyebrow={t("community")}
            title={activityTitle}
            detail={t("activityDetail", { count: communityActivity.value.toLocaleString(locale) })}
            tone={communityActivity.delta >= 0 ? "success" : "warning"}
          />
          <QuickInsight
            icon={UserPlus}
            eyebrow={t("growth")}
            title={growthTitle}
            detail={t("growthDetail", { count: summary.users.new.value.toLocaleString(locale) })}
            tone={summary.users.new.delta >= 0 ? "success" : "warning"}
          />
          <QuickInsight
            icon={CircleDollarSign}
            eyebrow={t("economyShort")}
            title={t(economyNet >= 0 ? "economyNetPositive" : "economyNetNegative", { count: Math.abs(economyNet).toLocaleString(locale) })}
            detail={t("economyInsightDetail", { circulating: summary.economy.circulating.toLocaleString(locale) })}
          />
          <QuickInsight
            icon={ShieldAlert}
            eyebrow={t("technicalHealth")}
            title={t(healthNeedsAttention ? "healthAttentionTitle" : "healthHealthyTitle")}
            detail={t(healthNeedsAttention ? "healthAttentionDetail" : "healthHealthyDetail")}
            tone={healthNeedsAttention ? "warning" : "success"}
          />
        </div>
      </Section>

      <Section title={t("overview")} icon={Users} description={t("overviewDescription")}>
        <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <VisualPanel title={t("engagementRhythm")} description={t("engagementRhythmDescription")}>
            <EngagementRhythm
              dau={summary.users.dau}
              wau={summary.users.wau}
              mau={summary.users.mau}
              locale={locale}
              labels={{ dau: t("dau"), wau: t("wau"), mau: t("mau"), daily: t("dailyStickiness"), weekly: t("weeklyStickiness") }}
            />
          </VisualPanel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricCard label={t("dau")} metric={summary.users.dau} locale={locale} />
            <MetricCard label={t("wau")} metric={summary.users.wau} locale={locale} />
            <MetricCard label={t("mau")} metric={summary.users.mau} locale={locale} />
            <MetricCard label={t("activeUsers", { days: summary.range.days })} metric={summary.users.active} locale={locale} />
            <MetricCard label={t("newUsers")} metric={summary.users.new} locale={locale} />
            <StaticMetricCard label={t("totalUsers")} value={summary.users.total} locale={locale} />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("activityDefinition")}</p>
      </Section>

      <Section title={t("community")} icon={MessageCircleMore} description={t("communityDescription")}>
        <VisualPanel title={t("activityMix")} description={t("activityMixDescription")}>
          <ComparisonBars
            items={[
              { label: t("messages"), metric: summary.community.messages },
              { label: t("dms"), metric: summary.community.directMessages },
              { label: t("follows"), metric: summary.community.follows },
              { label: t("likes"), metric: summary.community.likes },
            ]}
            locale={locale}
            currentLabel={t("currentPeriod")}
            previousLabel={t("previousPeriod")}
          />
        </VisualPanel>
      </Section>

      <div className="grid items-start gap-8 xl:grid-cols-2">
        <Section title={t("progression")} icon={Sparkles} description={t("progressionDescription")}>
          <VisualPanel title={t("progressionPulse")} description={t("progressionPulseDescription")}>
            <ComparisonBars
              items={[
                { label: t("levelUps"), metric: summary.progression.levelUps },
                { label: t("achievements"), metric: summary.progression.achievements },
                { label: t("profilesCompleted"), metric: summary.progression.profileCompleted },
              ]}
              locale={locale}
              currentLabel={t("currentPeriod")}
              previousLabel={t("previousPeriod")}
            />
          </VisualPanel>
        </Section>

        <Section title={t("onboarding")} icon={Activity} description={t("onboardingDescription")}>
          <VisualPanel title={t("onboardingJourney")} description={t("funnelNote")}>
            <FunnelVisual
              steps={[
                { label: t("funnelAccounts"), value: summary.funnels.onboarding.accounts },
                { label: t("funnelProfiles"), value: summary.funnels.onboarding.profilesCompleted },
                { label: t("funnelSocial"), value: summary.funnels.onboarding.socialInteraction },
              ]}
              locale={locale}
              conversionLabel={t("stepConversion")}
            />
          </VisualPanel>
        </Section>
      </div>

      <Section title={t("economy")} icon={CircleDollarSign} description={t("economyDescription")}>
        <div className="grid items-start gap-5 xl:grid-cols-2">
          <VisualPanel title={t("economyFlow")} description={t("economyFlowDescription")}>
            <EconomyFlow
              emitted={summary.economy.emitted}
              spent={summary.economy.spent}
              circulating={summary.economy.circulating}
              locale={locale}
              labels={{
                emitted: t("coinsEmitted"),
                spent: t("coinsSpent"),
                net: t("netCoins"),
                circulating: t("coinsCirculatingShort"),
              }}
            />
          </VisualPanel>
          <VisualPanel title={t("topCosmetics")} description={t("topCosmeticsDescription")}>
            <RankedBars
              items={summary.cosmetics.top.map((cosmetic) => ({
                id: cosmetic.id,
                label: locale === "en" ? cosmetic.nameEn : cosmetic.name,
                value: cosmetic.purchases,
              }))}
              locale={locale}
              emptyLabel={t("noCosmeticPurchases")}
            />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MetricCard label={t("cosmeticPurchases")} metric={summary.cosmetics.purchases} locale={locale} />
              <MetricCard label={t("cosmeticsEquipped")} metric={summary.cosmetics.equips} locale={locale} />
            </div>
          </VisualPanel>
        </div>
      </Section>

      <div className="grid items-start gap-8 xl:grid-cols-2">
        <Section title={t("creators")} icon={SECTION_ICONS.creators} description={t("creatorsDescription")}>
          <VisualPanel title={t("creatorProgram")} description={t("creatorProgramDescription")}>
            <ProgramVisual
              applications={summary.creators.applications}
              approvals={summary.creators.approvals}
              active={summary.creators.active}
              featured={summary.creators.featured}
              locale={locale}
              labels={{
                applications: t("creatorApplications"),
                approvals: t("creatorApprovals"),
                featuredShare: t("featuredShare"),
                active: t("activeCreators"),
                featured: t("featuredCreators"),
                current: t("currentPeriod"),
                previous: t("previousPeriod"),
              }}
            />
          </VisualPanel>
        </Section>

        <Section title={t("moderation")} icon={ShieldAlert} description={t("moderationDescription")}>
          <VisualPanel title={t("moderationPulse")} description={t("moderationPulseDescription")}>
            <ComparisonBars
              items={[{ label: t("reportsCreated"), metric: summary.moderation.reports }]}
              locale={locale}
              currentLabel={t("currentPeriod")}
              previousLabel={t("previousPeriod")}
            />
            <div className="mt-5 rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("openReports")}</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">{summary.moderation.openReports.toLocaleString(locale)}</p>
            </div>
          </VisualPanel>
        </Section>
      </div>

      <Section title={t("technicalHealth")} icon={ShieldAlert} description={t("technicalHealthDescription")}>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
          <div className="space-y-4">
            <HealthVisual
              errorsLast24h={summary.health.errorsLast24h}
              openErrors={summary.health.openErrors}
              significantEventsLast24h={summary.health.significantEventsLast24h}
              locale={locale}
              labels={{
                healthy: t("healthHealthyTitle"),
                attention: t("healthAttentionTitle"),
                healthyDetail: t("healthHealthyDetail"),
                attentionDetail: t("healthAttentionDetail"),
                errors24h: t("errorsLast24h"),
                open: t("openErrors"),
                events: t("significantEventsLast24h"),
              }}
            />
            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card/40 p-4 text-sm text-muted-foreground">
              {summary.health.lastError ? <span>{t("lastError", { area: summary.health.lastError.area, date: new Date(summary.health.lastError.lastSeenAt).toLocaleString(locale) })}</span> : <StatusBadge tone="success">{t("noRecentError")}</StatusBadge>}
              {summary.health.lastEvent && <span>{t("lastAnalyticsEvent", { type: summary.health.lastEvent.type, date: new Date(summary.health.lastEvent.createdAt).toLocaleString(locale) })}</span>}
            </div>
          </div>
          <VisualPanel title={t("recentErrors")} description={t("recentErrorsDescription")}>
            <ErrorManager initialErrors={errorEntries} locale={locale} />
          </VisualPanel>
        </div>
      </Section>
    </div>
  );
}
