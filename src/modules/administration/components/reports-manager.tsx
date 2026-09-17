"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Check, X, Flag } from "lucide-react";
import { StatusBadge } from "@/modules/administration/components/ui/status-badge";
import { EmptyState } from "@/modules/administration/components/ui/empty-state";

type ReportStatus = "OPEN" | "REVIEWED" | "DISMISSED";

interface PersonRef {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
}

interface ReportRow {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter: PersonRef;
  reviewedBy: PersonRef | null;
  targetContext: { content: string; deletedAt: string | null; author: PersonRef } | null;
}



const STATUS_TONE: Record<ReportStatus, "danger" | "success" | "neutral"> = {
  OPEN: "danger",
  REVIEWED: "success",
  DISMISSED: "neutral",
};

function personLabel(p: PersonRef) {
  return p.displayName || p.name || p.username || p.id;
}

export default function ReportsManager({ initialReports }: { initialReports: ReportRow[] }) {
  const tCompletion = useTranslations("Completion");
  const completionLocale = useLocale();
const STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: tCompletion("open"),
  REVIEWED: tCompletion("reviewed"),
  DISMISSED: tCompletion("dismissed"),
};

  const t = useTranslations("AdminChat");
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState<ReportStatus | "ALL">("OPEN");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(
    () => (filter === "ALL" ? reports : reports.filter((r) => r.status === filter)),
    [reports, filter]
  );

  async function resolve(report: ReportRow, action: "review" | "dismiss") {
    setBusyId(report.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || tCompletion("reportError"));
        return;
      }
      setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, ...data.report, targetContext: r.targetContext } : r)));
    } catch { setError(tCompletion("networkError")); } finally {
      setBusyId(null);
    }
  }

  async function hideGlobalMessage(report: ReportRow) {
    setBusyId(report.id);
    setError("");
    try {
      const endpoint = report.targetType === "GLOBAL_CHAT_MESSAGE"
        ? `/api/admin/chat/messages/${report.targetId}`
        : `/api/admin/messaging/messages/${report.targetId}`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hide" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t("hideError")); return; }
      setReports((prev) => prev.map((item) => item.id === report.id ? {
        ...item,
        targetContext: item.targetContext ? { ...item.targetContext, deletedAt: data.message.deletedAt } : null,
      } : item));
    } catch { setError(tCompletion("networkError")); } finally { setBusyId(null); }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {(["OPEN", "REVIEWED", "DISMISSED", "ALL"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? "border-primary/20 bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:bg-primary/5"
            }`}
          >
            {f === "ALL" ? tCompletion("all") : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Flag} title={tCompletion("reportsEmpty")} />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border border-primary/10 bg-card/20 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 break-words">
                  <StatusBadge tone={STATUS_TONE[r.status]}>{STATUS_LABELS[r.status]}</StatusBadge>
                  <div className="mt-2 text-sm text-foreground">
                    <span className="font-medium">{personLabel(r.reporter)}</span> {tCompletion("reported")}{" "}
                    <span className="font-medium">{r.targetType.toLowerCase()}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.reason}</p>
                  {r.details && <p className="mt-1 text-xs text-muted-foreground">{r.details}</p>}
                  {r.targetContext && (
                    <div className="mt-3 rounded-xl border border-border bg-background/40 px-3 py-2 text-xs">
                      <p className="font-medium text-foreground">{t("context")}: {personLabel(r.targetContext.author)}</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{r.targetContext.content || t("messageDeleted")}</p>
                    </div>
                  )}
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground/50">
                    {new Date(r.createdAt).toLocaleString(completionLocale)}
                    {r.reviewedBy && ` · ${tCompletion("resolvedBy", { name: personLabel(r.reviewedBy) })}`}
                  </p>
                </div>
                {r.status === "OPEN" && (
                  <div className="flex shrink-0 gap-1">
                    {(r.targetType === "GLOBAL_CHAT_MESSAGE" || r.targetType === "DIRECT_MESSAGE") && !r.targetContext?.deletedAt && (
                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/10 disabled:opacity-50 dark:text-amber-400"
                        disabled={busyId === r.id}
                        onClick={() => hideGlobalMessage(r)}
                      >
                        {t("hideMessage")}
                      </button>
                    )}
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
                      disabled={busyId === r.id}
                      onClick={() => resolve(r, "review")}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2} />
                      {tCompletion("review")}</button>
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground disabled:opacity-50"
                      disabled={busyId === r.id}
                      onClick={() => resolve(r, "dismiss")}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                      {tCompletion("dismiss")}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
