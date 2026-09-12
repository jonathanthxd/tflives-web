"use client";

import { useState } from "react";
import { Check, EyeOff, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/modules/administration/components/ui/status-badge";

type ErrorEntry = {
  id: string;
  area: string;
  message: string;
  count: number;
  status: "OPEN" | "RESOLVED" | "IGNORED";
  firstSeenAt: string;
  lastSeenAt: string;
  lastStatus: number | null;
};

function statusTone(status: ErrorEntry["status"]) {
  return status === "OPEN" ? "danger" : status === "IGNORED" ? "warning" : "success";
}

export function ErrorManager({ initialErrors, locale }: { initialErrors: ErrorEntry[]; locale: string }) {
  const t = useTranslations("Analytics");
  const [errors, setErrors] = useState(initialErrors);
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(id: string, status: ErrorEntry["status"]) {
    setUpdating(id);
    try {
      const response = await fetch(`/api/admin/observability/errors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) return;
      const data = await response.json() as { error: ErrorEntry };
      setErrors((current) => current.map((entry) => entry.id === id ? data.error : entry));
    } finally {
      setUpdating(null);
    }
  }

  if (!errors.length) return <p className="rounded-xl border border-dashed border-primary/15 px-4 py-5 text-sm text-muted-foreground">{t("noErrors")}</p>;

  return <ol className="space-y-3" aria-label={t("recentErrors")}>
    {errors.map((entry) => <li key={entry.id} className="rounded-xl border border-primary/10 bg-background/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{entry.area}</p><p className="mt-1 break-words text-sm text-foreground">{entry.message}</p></div><StatusBadge tone={statusTone(entry.status)}>{t(`error${entry.status.charAt(0)}${entry.status.slice(1).toLowerCase()}`)}</StatusBadge></div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span>{t("errorOccurrences", { count: entry.count })}{entry.lastStatus ? ` · HTTP ${entry.lastStatus}` : ""}</span><time dateTime={entry.lastSeenAt}>{t("lastSeen", { date: new Date(entry.lastSeenAt).toLocaleString(locale) })}</time></div>
      <div className="mt-3 flex flex-wrap gap-2">
        {entry.status !== "RESOLVED" && <button type="button" disabled={updating === entry.id} onClick={() => updateStatus(entry.id, "RESOLVED")} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-300"><Check className="h-3.5 w-3.5" />{t("resolve")}</button>}
        {entry.status !== "IGNORED" && <button type="button" disabled={updating === entry.id} onClick={() => updateStatus(entry.id, "IGNORED")} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-500/10 disabled:opacity-50 dark:text-amber-300"><EyeOff className="h-3.5 w-3.5" />{t("ignore")}</button>}
        {entry.status !== "OPEN" && <button type="button" disabled={updating === entry.id} onClick={() => updateStatus(entry.id, "OPEN")} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" />{t("reopen")}</button>}
      </div>
    </li>)}
  </ol>;
}
