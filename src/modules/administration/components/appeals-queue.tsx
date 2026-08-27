"use client";

import { useEffect, useState } from "react";
import { Ban, Clock3, VolumeX, TriangleAlert, Check, X, MessageSquareWarning, type LucideIcon } from "lucide-react";
import { EmptyState } from "@/modules/administration/components/ui/empty-state";

type SanctionType = "BAN" | "SUSPEND" | "MUTE" | "WARNING";

interface PersonRef {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
}

interface AppealRow {
  id: string;
  message: string;
  status: "PENDING" | "APPROVED" | "DENIED";
  createdAt: string;
  user: PersonRef;
  sanction: { type: SanctionType; reason: string };
}

const TYPE_LABELS: Record<SanctionType, string> = {
  BAN: "Ban",
  SUSPEND: "Suspensión",
  MUTE: "Silencio",
  WARNING: "Advertencia",
};

const TYPE_ICONS: Record<SanctionType, LucideIcon> = {
  BAN: Ban,
  SUSPEND: Clock3,
  MUTE: VolumeX,
  WARNING: TriangleAlert,
};

function personLabel(p: PersonRef) {
  return p.displayName || p.name || p.username || p.id;
}

export default function AppealsQueue() {
  const [appeals, setAppeals] = useState<AppealRow[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/appeals?status=PENDING")
      .then((res) => res.json())
      .then((data) => setAppeals(data.appeals ?? []))
      .catch(() => setAppeals([]));
  }, []);

  async function resolve(appeal: AppealRow, decision: "approve" | "deny") {
    setBusyId(appeal.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/appeals/${appeal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: notes[appeal.id] ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al resolver la apelación");
        return;
      }
      setAppeals((prev) => (prev ? prev.filter((a) => a.id !== appeal.id) : prev));
    } finally {
      setBusyId(null);
    }
  }

  if (!appeals) return null;

  return (
    <div className="mb-8">
      <h3 className="mb-3 font-medium text-foreground">Apelaciones pendientes</h3>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {appeals.length === 0 ? (
        <EmptyState icon={MessageSquareWarning} title="No hay apelaciones pendientes" />
      ) : (
        <div className="space-y-3">
          {appeals.map((a) => {
            const Icon = TYPE_ICONS[a.sanction.type];
            return (
              <div key={a.id} className="rounded-2xl border border-primary/10 bg-card/20 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground">
                      <span className="font-medium">{personLabel(a.user)}</span> apeló su{" "}
                      <span className="font-medium">{TYPE_LABELS[a.sanction.type].toLowerCase()}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground/70">Motivo original: {a.sanction.reason}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{a.message}</p>
                    <p className="mt-2 font-mono text-[11px] text-muted-foreground/50">
                      {new Date(a.createdAt).toLocaleString("es-ES")}
                    </p>

                    <textarea
                      className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
                      rows={2}
                      placeholder="Nota para el usuario (opcional)"
                      value={notes[a.id] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [a.id]: e.target.value }))}
                    />
                    <div className="mt-2 flex justify-end gap-1">
                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
                        disabled={busyId === a.id}
                        onClick={() => resolve(a, "approve")}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2} />
                        Aceptar y revocar sanción
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground disabled:opacity-50"
                        disabled={busyId === a.id}
                        onClick={() => resolve(a, "deny")}
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
