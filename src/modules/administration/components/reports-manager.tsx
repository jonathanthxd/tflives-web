"use client";

import { useMemo, useState } from "react";
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
  status: ReportStatus;
  createdAt: string;
  reporter: PersonRef;
  reviewedBy: PersonRef | null;
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: "Abierto",
  REVIEWED: "Revisado",
  DISMISSED: "Descartado",
};

const STATUS_TONE: Record<ReportStatus, "danger" | "success" | "neutral"> = {
  OPEN: "danger",
  REVIEWED: "success",
  DISMISSED: "neutral",
};

function personLabel(p: PersonRef) {
  return p.displayName || p.name || p.username || p.id;
}

export default function ReportsManager({ initialReports }: { initialReports: ReportRow[] }) {
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
        setError(data.error || "Error al actualizar el reporte");
        return;
      }
      setReports((prev) => prev.map((r) => (r.id === report.id ? data.report : r)));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-6 flex gap-2">
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
            {f === "ALL" ? "Todos" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Flag} title="No hay reportes en esta categoría" />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border border-primary/10 bg-card/20 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <StatusBadge tone={STATUS_TONE[r.status]}>{STATUS_LABELS[r.status]}</StatusBadge>
                  <div className="mt-2 text-sm text-foreground">
                    <span className="font-medium">{personLabel(r.reporter)}</span> reportó{" "}
                    <span className="font-medium">{r.targetType.toLowerCase()}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.reason}</p>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground/50">
                    {new Date(r.createdAt).toLocaleString("es-ES")}
                    {r.reviewedBy && ` · resuelto por ${personLabel(r.reviewedBy)}`}
                  </p>
                </div>
                {r.status === "OPEN" && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
                      disabled={busyId === r.id}
                      onClick={() => resolve(r, "review")}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2} />
                      Marcar revisado
                    </button>
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground disabled:opacity-50"
                      disabled={busyId === r.id}
                      onClick={() => resolve(r, "dismiss")}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                      Descartar
                    </button>
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
