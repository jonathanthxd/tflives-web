"use client";

import { useState } from "react";
import { Megaphone, Send, Users, ShieldCheck, Globe } from "lucide-react";
import { Button } from "@/shared/ui/button";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/modules/administration/components/ui/empty-state";
import { StatusBadge } from "@/modules/administration/components/ui/status-badge";

type Segment = "ALL" | "USERS" | "STAFF";

interface PersonRef {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  segment: Segment;
  createdAt: string;
  createdBy: PersonRef;
}

const SEGMENT_LABELS: Record<Segment, string> = {
  ALL: "Toda la comunidad",
  USERS: "Solo usuarios",
  STAFF: "Solo staff (MOD/ADMIN)",
};

const SEGMENT_ICONS: Record<Segment, typeof Globe> = {
  ALL: Globe,
  USERS: Users,
  STAFF: ShieldCheck,
};

function personLabel(p: PersonRef) {
  return p.displayName || p.name || p.username || p.id;
}

export default function AnnouncementsManager({
  initialAnnouncements,
}: {
  initialAnnouncements: AnnouncementRow[];
}) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState<Segment>("ALL");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastSent, setLastSent] = useState<{ recipientCount: number } | null>(null);

  async function send() {
    setBusy(true);
    setError("");
    setLastSent(null);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, segment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al enviar el anuncio");
        return;
      }
      setAnnouncements((prev) => [
        {
          id: data.announcement.id,
          title: data.announcement.title,
          body: data.announcement.body,
          segment: data.announcement.segment,
          createdAt: data.announcement.createdAt,
          createdBy: { id: "", username: null, displayName: "Vos", name: null },
        },
        ...prev,
      ]);
      setLastSent({ recipientCount: data.recipientCount });
      setTitle("");
      setBody("");
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {lastSent && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Anuncio enviado a {lastSent.recipientCount} usuario{lastSent.recipientCount === 1 ? "" : "s"}.
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-primary/10 bg-card/20 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-medium text-foreground">
          <Megaphone className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          Nuevo anuncio
        </h2>
        <div className="space-y-3">
          <input
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            placeholder="Mensaje"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <select
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/40 sm:w-64"
            value={segment}
            onChange={(e) => setSegment(e.target.value as Segment)}
          >
            {(["ALL", "USERS", "STAFF"] as Segment[]).map((s) => (
              <option key={s} value={s}>
                {SEGMENT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            onClick={() => setConfirming(true)}
            disabled={busy || !title.trim() || !body.trim()}
          >
            <Send className="h-4 w-4" strokeWidth={2} data-icon="inline-start" />
            Enviar anuncio
          </Button>
        </div>
      </div>

      <h3 className="mb-3 font-medium text-foreground">Historial</h3>
      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="Todavía no se envió ningún anuncio" />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const SegmentIcon = SEGMENT_ICONS[a.segment];
            return (
              <div key={a.id} className="rounded-2xl border border-primary/10 bg-card/20 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">{a.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                    <p className="mt-2 font-mono text-[11px] text-muted-foreground/50">
                      {personLabel(a.createdBy)} · {new Date(a.createdAt).toLocaleString("es-ES")}
                    </p>
                  </div>
                  <StatusBadge tone="primary" dot={false}>
                    <SegmentIcon className="h-3 w-3" strokeWidth={2} />
                    {SEGMENT_LABELS[a.segment]}
                  </StatusBadge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title="Enviar anuncio"
        description={`Esto va a notificar a: ${SEGMENT_LABELS[segment]}. No se puede deshacer.`}
        confirmLabel="Enviar"
        cancelLabel="Cancelar"
        busy={busy}
        onConfirm={send}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
