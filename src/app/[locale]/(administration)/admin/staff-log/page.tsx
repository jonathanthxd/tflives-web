import { getTranslations } from "next-intl/server";
import { ScrollText, ShieldAlert, Newspaper, Gamepad2, Users, Flag, MessageSquareWarning, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireSectionPage } from "@/modules/administration/page-guard";
import { listAdminActionLog } from "@/modules/administration/action-log";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { EmptyState } from "@/modules/administration/components/ui/empty-state";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const instant = false;

function actorLabel(actor: { username: string | null; displayName: string | null; name: string | null } | null) {
  return actor?.displayName || actor?.name || actor?.username || "—";
}

const ACTION_ICONS: [prefix: string, icon: LucideIcon][] = [
  ["sanction", ShieldAlert], ["post", Newspaper], ["modality", Gamepad2], ["user", Users], ["report", Flag], ["appeal", MessageSquareWarning],
];

function actionIcon(action: string): LucideIcon {
  return ACTION_ICONS.find(([prefix]) => action.startsWith(prefix))?.[1] ?? ScrollText;
}

export default async function StaffLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ actor?: string; action?: string; target?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  await requireSectionPage("staffLog", locale);
  const [entries, t] = await Promise.all([
    listAdminActionLog({ limit: 200, actor: query.actor, action: query.action, targetId: query.target }),
    getTranslations({ locale, namespace: "AdminPlatform" }),
  ]);
  const hasFilters = Boolean(query.actor || query.action || query.target);

  return (
    <div>
      <PageHeader icon={SECTION_ICONS.staffLog} title={t("auditTitle")} description={t("auditDescription")} />
      <form className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/10 bg-card/25 p-4 sm:flex-row sm:items-end">
        {query.target && <input type="hidden" name="target" value={query.target} />}
        <label className="grid flex-1 gap-1.5 text-sm font-medium text-foreground"><span>{t("filterActor")}</span><input name="actor" defaultValue={query.actor} className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus:border-primary/50" /></label>
        <label className="grid flex-1 gap-1.5 text-sm font-medium text-foreground"><span>{t("filterAction")}</span><input name="action" defaultValue={query.action} className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus:border-primary/50" /></label>
        <div className="flex gap-2"><button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">{t("filter")}</button>{hasFilters && <Link href="/admin/staff-log" className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-foreground">{t("clearFilters")}</Link>}</div>
      </form>
      {entries.length === 0 ? <EmptyState icon={ScrollText} title={hasFilters ? t("noAuditResults") : t("noActivity")} /> : (
        <div className="overflow-x-auto rounded-2xl border border-primary/10 bg-card/20">
          <table className="min-w-[44rem] w-full">
            <thead><tr className="border-b border-primary/10"><th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("auditActor")}</th><th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("auditAction")}</th><th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("auditTarget")}</th><th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("auditDate")}</th></tr></thead>
            <tbody>{entries.map((entry) => { const Icon = actionIcon(entry.action); return <tr key={entry.id} className="border-b border-primary/5 transition-colors hover:bg-primary/5"><td className="px-5 py-4 text-sm font-medium text-foreground">{actorLabel(entry.actor)}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{entry.action.replaceAll(".", " · ")}</span></td><td className="max-w-[15rem] truncate px-5 py-4 font-mono text-xs text-muted-foreground/70">{entry.targetType ? `${entry.targetType} · ${entry.targetId ?? "—"}` : "—"}</td><td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground"><time dateTime={entry.createdAt.toISOString()}>{entry.createdAt.toLocaleString(locale)}</time></td></tr>; })}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
