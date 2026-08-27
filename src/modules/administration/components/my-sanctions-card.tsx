"use client";

import { useEffect, useState } from "react";
import { Ban, Clock3, VolumeX, TriangleAlert, Send, Clock, Check, X, type LucideIcon } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { StatusBadge } from "@/modules/administration/components/ui/status-badge";

type SanctionType = "BAN" | "SUSPEND" | "MUTE" | "WARNING";
type AppealStatus = "PENDING" | "APPROVED" | "DENIED";

interface Appeal {
  id: string;
  status: AppealStatus;
  message: string;
  reviewNote: string | null;
}

interface Sanction {
  id: string;
  type: SanctionType;
  reason: string;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  active: boolean;
  appeal: Appeal | null;
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

export default function MySanctionsCard() {
  const [sanctions, setSanctions] = useState<Sanction[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/appeals")
      .then((res) => res.json())
      .then((data) => setSanctions(data.sanctions ?? []))
      .catch(() => setSanctions([]));
  }, []);

  async function sendAppeal(sanctionId: string) {
    const message = (drafts[sanctionId] ?? "").trim();
    if (!message) return;
    setSending(sanctionId);
    setError("");
    try {
      const res = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sanctionId, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al enviar la apelación");
        return;
      }
      setSanctions((prev) =>
        prev ? prev.map((s) => (s.id === sanctionId ? { ...s, appeal: data.appeal } : s)) : prev
      );
      setDrafts((prev) => ({ ...prev, [sanctionId]: "" }));
    } finally {
      setSending(null);
    }
  }

  if (!sanctions || sanctions.length === 0) return null;

  return (
    <Card className="p-6">
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-foreground">
        Tu cuenta
      </h2>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {sanctions.map((s) => {
          const Icon = TYPE_ICONS[s.type];
          const canAppeal = s.active && (!s.appeal || s.appeal.status === "DENIED");
          return (
            <div key={s.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                    s.active
                      ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
                      : "border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                    {TYPE_LABELS[s.type]}
                    <StatusBadge tone={s.active ? "danger" : "neutral"} dot={false}>
                      {s.active ? "Activa" : s.revokedAt ? "Revocada" : "Expirada"}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.reason}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground/50">
                    {new Date(s.createdAt).toLocaleDateString("es-ES")}
                    {s.expiresAt && ` · vence ${new Date(s.expiresAt).toLocaleDateString("es-ES")}`}
                  </p>

                  {s.appeal && (
                    <div className="mt-3 rounded-lg bg-muted/30 p-3">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium">
                        {s.appeal.status === "PENDING" && (
                          <>
                            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
                            <span className="text-amber-600 dark:text-amber-400">Apelación en revisión</span>
                          </>
                        )}
                        {s.appeal.status === "APPROVED" && (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                            <span className="text-emerald-600 dark:text-emerald-400">Apelación aceptada</span>
                          </>
                        )}
                        {s.appeal.status === "DENIED" && (
                          <>
                            <X className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                            <span className="text-muted-foreground">Apelación rechazada</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{s.appeal.message}</p>
                      {s.appeal.reviewNote && (
                        <p className="mt-1 text-xs text-muted-foreground/70">
                          Respuesta del staff: {s.appeal.reviewNote}
                        </p>
                      )}
                    </div>
                  )}

                  {canAppeal && (
                    <div className="mt-3">
                      <textarea
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
                        rows={2}
                        placeholder="Contá por qué creés que esta sanción no debería aplicarse..."
                        value={drafts[s.id] ?? ""}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      />
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => sendAppeal(s.id)}
                          disabled={sending === s.id || !(drafts[s.id] ?? "").trim()}
                        >
                          <Send className="h-3.5 w-3.5" strokeWidth={2} data-icon="inline-start" />
                          Enviar apelación
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
