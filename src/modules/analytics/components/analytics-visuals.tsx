import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, CircleAlert, type LucideIcon } from "lucide-react";
import { Card } from "@/shared/ui/card";

export type AnalyticsMetric = {
  value: number;
  previous: number;
  delta: number;
  percent: number | null;
};

function percentOf(value: number, max: number) {
  if (max <= 0 || value <= 0) return 0;
  return Math.max(4, Math.min(100, (value / max) * 100));
}

function ratio(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

export function VisualPanel({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden p-5 sm:p-6 ${className}`}>
      <div className="mb-5">
        <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

export function QuickInsight({
  icon: Icon,
  eyebrow,
  title,
  detail,
  tone = "default",
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  detail: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass = tone === "success"
    ? "border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-600 dark:text-emerald-400"
    : tone === "warning"
      ? "border-amber-500/20 bg-amber-500/[0.04] text-amber-600 dark:text-amber-400"
      : "border-primary/20 bg-primary/[0.035] text-primary";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-background/50">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-75">{eyebrow}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}

export function MetricTrend({ metric, locale }: { metric: AnalyticsMetric; locale: string }) {
  const Icon = metric.delta > 0 ? ArrowUpRight : metric.delta < 0 ? ArrowDownRight : ArrowRight;
  const value = metric.percent === null ? "—" : `${metric.percent > 0 ? "+" : ""}${metric.percent}%`;
  const tone = metric.delta > 0
    ? "text-emerald-600 dark:text-emerald-400"
    : metric.delta < 0
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${tone}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {value}
      <span className="sr-only">{metric.delta.toLocaleString(locale)}</span>
    </span>
  );
}

export function ComparisonBars({
  items,
  locale,
  currentLabel,
  previousLabel,
}: {
  items: Array<{ label: string; metric: AnalyticsMetric }>;
  locale: string;
  currentLabel: string;
  previousLabel: string;
}) {
  const max = Math.max(1, ...items.flatMap((item) => [item.metric.value, item.metric.previous]));

  return (
    <div className="space-y-5">
      {(currentLabel || previousLabel) && <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-hidden="true">
        {currentLabel && <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-primary" />{currentLabel}</span>}
        {previousLabel && <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-muted-foreground/25" />{previousLabel}</span>}
      </div>}
      {items.map(({ label, metric }) => (
        <div key={label} className="space-y-2" aria-label={`${label}: ${metric.value.toLocaleString(locale)}, ${previousLabel}: ${metric.previous.toLocaleString(locale)}`}>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{label}</p>
              <p className="font-mono text-lg font-medium tabular-nums text-foreground">{metric.value.toLocaleString(locale)}</p>
            </div>
            <MetricTrend metric={metric} locale={locale} />
          </div>
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-primary/10">
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${percentOf(metric.value, max)}%` }} />
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
              <div className="h-full rounded-full bg-muted-foreground/25" style={{ width: `${percentOf(metric.previous, max)}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EngagementRhythm({
  dau,
  wau,
  mau,
  locale,
  labels,
}: {
  dau: AnalyticsMetric;
  wau: AnalyticsMetric;
  mau: AnalyticsMetric;
  locale: string;
  labels: { dau: string; wau: string; mau: string; daily: string; weekly: string };
}) {
  const max = Math.max(1, dau.value, wau.value, mau.value);
  const daily = ratio(dau.value, wau.value);
  const weekly = ratio(wau.value, mau.value);
  const points = [
    { label: labels.dau, value: dau.value },
    { label: labels.wau, value: wau.value },
    { label: labels.mau, value: mau.value },
  ];

  return (
    <div>
      <div className="flex h-44 items-end justify-around gap-4 rounded-2xl border border-primary/10 bg-background/40 px-4 pb-4 pt-7">
        {points.map((point) => (
          <div key={point.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{point.value.toLocaleString(locale)}</span>
            <div className="flex h-full w-full max-w-16 items-end rounded-t-xl bg-primary/[0.06]">
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-primary/60 to-primary transition-[height] duration-500"
                style={{ height: `${point.value === 0 ? 3 : Math.max(10, (point.value / max) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{point.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{labels.daily}</span><strong className="font-mono text-sm text-foreground">{daily}%</strong></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${daily}%` }} /></div>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{labels.weekly}</span><strong className="font-mono text-sm text-foreground">{weekly}%</strong></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${weekly}%` }} /></div>
        </div>
      </div>
    </div>
  );
}

export function FunnelVisual({
  steps,
  locale,
  conversionLabel,
}: {
  steps: Array<{ label: string; value: number }>;
  locale: string;
  conversionLabel: string;
}) {
  const max = Math.max(1, steps[0]?.value ?? 0, ...steps.map((step) => step.value));
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const previous = index === 0 ? step.value : steps[index - 1].value;
        const conversion = index === 0 ? 100 : ratio(step.value, previous);
        return (
          <div key={step.label} className="relative overflow-hidden rounded-xl border border-primary/10 bg-background/40 p-3">
            <div className="absolute inset-y-0 left-0 bg-primary/[0.07]" style={{ width: `${percentOf(step.value, max)}%` }} aria-hidden="true" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                {index > 0 && <p className="mt-0.5 text-[11px] text-muted-foreground">{conversionLabel}: {conversion}%</p>}
              </div>
              <strong className="font-mono text-lg tabular-nums text-foreground">{step.value.toLocaleString(locale)}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EconomyFlow({
  emitted,
  spent,
  circulating,
  locale,
  labels,
}: {
  emitted: AnalyticsMetric;
  spent: AnalyticsMetric;
  circulating: number;
  locale: string;
  labels: { emitted: string; spent: string; net: string; circulating: string };
}) {
  const max = Math.max(1, emitted.value, spent.value);
  const net = emitted.value - spent.value;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {[{ label: labels.emitted, metric: emitted }, { label: labels.spent, metric: spent }].map(({ label, metric }) => (
          <div key={label} className="rounded-xl border border-primary/10 bg-background/40 p-4">
            <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">{label}</span><MetricTrend metric={metric} locale={locale} /></div>
            <p className="mt-2 font-mono text-2xl font-medium tabular-nums text-foreground">{metric.value.toLocaleString(locale)}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-primary" style={{ width: `${percentOf(metric.value, max)}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{labels.net}</p><p className={`mt-1 font-mono text-lg font-semibold tabular-nums ${net < 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>{net > 0 ? "+" : ""}{net.toLocaleString(locale)}</p></div>
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{labels.circulating}</p><p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">{circulating.toLocaleString(locale)}</p></div>
      </div>
    </div>
  );
}

export function RankedBars({
  items,
  locale,
  emptyLabel,
}: {
  items: Array<{ id: string; label: string; value: number }>;
  locale: string;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{emptyLabel}</div>;
  }
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item.id}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-foreground"><span className="mr-2 font-mono text-xs text-muted-foreground">#{index + 1}</span>{item.label}</span>
            <strong className="shrink-0 font-mono tabular-nums text-foreground">{item.value.toLocaleString(locale)}</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-primary" style={{ width: `${percentOf(item.value, max)}%` }} /></div>
        </li>
      ))}
    </ol>
  );
}

export function ProgramVisual({
  applications,
  approvals,
  active,
  featured,
  locale,
  labels,
}: {
  applications: AnalyticsMetric;
  approvals: AnalyticsMetric;
  active: number;
  featured: number;
  locale: string;
  labels: { applications: string; approvals: string; featuredShare: string; active: string; featured: string; current: string; previous: string };
}) {
  const featuredShare = ratio(featured, active);
  return (
    <div className="space-y-4">
      <ComparisonBars
        items={[{ label: labels.applications, metric: applications }, { label: labels.approvals, metric: approvals }]}
        locale={locale}
        currentLabel={labels.current}
        previousLabel={labels.previous}
      />
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-center"><p className="font-mono text-lg font-semibold text-foreground">{featuredShare}%</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{labels.featuredShare}</p></div>
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-center"><p className="font-mono text-lg font-semibold text-foreground">{active.toLocaleString(locale)}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{labels.active}</p></div>
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-center"><p className="font-mono text-lg font-semibold text-foreground">{featured.toLocaleString(locale)}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{labels.featured}</p></div>
      </div>
    </div>
  );
}

export function HealthVisual({
  errorsLast24h,
  openErrors,
  significantEventsLast24h,
  locale,
  labels,
}: {
  errorsLast24h: number;
  openErrors: number;
  significantEventsLast24h: number;
  locale: string;
  labels: { healthy: string; attention: string; healthyDetail: string; attentionDetail: string; errors24h: string; open: string; events: string };
}) {
  const healthy = errorsLast24h === 0 && openErrors === 0;
  const Icon = healthy ? CheckCircle2 : CircleAlert;
  return (
    <div className={`rounded-2xl border p-5 ${healthy ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-amber-500/20 bg-amber-500/[0.04]"}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${healthy ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}><Icon className="h-5 w-5" /></div>
        <div><p className="font-display text-base font-semibold text-foreground">{healthy ? labels.healthy : labels.attention}</p><p className="mt-1 text-sm text-muted-foreground">{healthy ? labels.healthyDetail : labels.attentionDetail}</p></div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div><p className="font-mono text-xl font-semibold tabular-nums text-foreground">{errorsLast24h.toLocaleString(locale)}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{labels.errors24h}</p></div>
        <div><p className="font-mono text-xl font-semibold tabular-nums text-foreground">{openErrors.toLocaleString(locale)}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{labels.open}</p></div>
        <div><p className="font-mono text-xl font-semibold tabular-nums text-foreground">{significantEventsLast24h.toLocaleString(locale)}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{labels.events}</p></div>
      </div>
    </div>
  );
}
