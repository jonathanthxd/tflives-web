"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Trophy, Award, ChevronUp, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/modules/administration/components/ui/empty-state";
import { StatusBadge } from "@/modules/administration/components/ui/status-badge";
import { ACHIEVEMENT_ICONS } from "@/modules/administration/components/ui/icons";

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  order: number;
  active: boolean;
  _count: { awards: number };
}

interface Holder {
  userId: string;
  username: string | null;
  displayName: string | null;
  awardedAt: string;
}

const ICON_KEYS = Object.keys(ACHIEVEMENT_ICONS);

export default function AchievementManager({ initialAchievements }: { initialAchievements: Achievement[] }) {
  const [achievements, setAchievements] = useState(initialAchievements);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconKey, setIconKey] = useState(ICON_KEYS[0]);
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Achievement | null>(null);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [holders, setHolders] = useState<Record<string, Holder[]>>({});
  const [awardUsername, setAwardUsername] = useState("");
  const [awardBusy, setAwardBusy] = useState(false);
  const [awardError, setAwardError] = useState("");

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setName("");
    setDescription("");
    setIconKey(ICON_KEYS[0]);
    setOrder(achievements.length);
    setActive(true);
    setError("");
  }

  function openEdit(a: Achievement) {
    setCreating(false);
    setEditing(a);
    setName(a.name);
    setDescription(a.description);
    setIconKey(a.iconKey);
    setOrder(a.order);
    setActive(a.active);
    setError("");
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setError("");
  }

  async function handleSubmit() {
    setBusy(true);
    setError("");
    try {
      const isEdit = !!editing;
      const res = await fetch(isEdit ? `/api/admin/achievements/${editing!.id}` : "/api/admin/achievements", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, iconKey, order, active }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }
      const saved = isEdit ? { ...data.achievement, _count: editing!._count } : { ...data.achievement, _count: { awards: 0 } };
      if (isEdit) {
        setAchievements((prev) => prev.map((a) => (a.id === editing!.id ? saved : a)).sort((a, b) => a.order - b.order));
      } else {
        setAchievements((prev) => [...prev, saved].sort((a, b) => a.order - b.order));
      }
      closeForm();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/achievements/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al eliminar");
        setDeleting(null);
        return;
      }
      setAchievements((prev) => prev.filter((a) => a.id !== deleting.id));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }

  async function toggleExpand(a: Achievement) {
    if (expanded === a.id) {
      setExpanded(null);
      return;
    }
    setExpanded(a.id);
    setAwardUsername("");
    setAwardError("");
    if (!holders[a.id]) {
      const res = await fetch(`/api/admin/achievements/${a.id}/holders`);
      const data = await res.json();
      if (res.ok) setHolders((prev) => ({ ...prev, [a.id]: data.holders }));
    }
  }

  async function handleAward(achievementId: string) {
    if (!awardUsername.trim()) return;
    setAwardBusy(true);
    setAwardError("");
    try {
      const res = await fetch("/api/admin/achievements/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: awardUsername.trim(), achievementId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAwardError(data.error || "Error al otorgar");
        return;
      }
      setAwardUsername("");
      const res2 = await fetch(`/api/admin/achievements/${achievementId}/holders`);
      const data2 = await res2.json();
      if (res2.ok) setHolders((prev) => ({ ...prev, [achievementId]: data2.holders }));
      setAchievements((prev) =>
        prev.map((a) => (a.id === achievementId ? { ...a, _count: { awards: a._count.awards + 1 } } : a))
      );
    } finally {
      setAwardBusy(false);
    }
  }

  async function handleRevoke(achievementId: string, targetUserId: string) {
    setAwardBusy(true);
    setAwardError("");
    try {
      const res = await fetch("/api/admin/achievements/award", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, achievementId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAwardError(data.error || "Error al revocar");
        return;
      }
      setHolders((prev) => ({
        ...prev,
        [achievementId]: (prev[achievementId] || []).filter((h) => h.userId !== targetUserId),
      }));
      setAchievements((prev) =>
        prev.map((a) => (a.id === achievementId ? { ...a, _count: { awards: Math.max(0, a._count.awards - 1) } } : a))
      );
    } finally {
      setAwardBusy(false);
    }
  }

  const showForm = creating || !!editing;

  return (
    <div>
      {error && !showForm && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-6 flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" strokeWidth={2} data-icon="inline-start" />
          Nuevo logro
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border border-primary/10 bg-card/20 p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
            {editing ? `Editar ${editing.name}` : "Nuevo logro"}
          </h2>
          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Orden
              <input
                type="number"
                className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
              />
            </label>
          </div>
          <textarea
            className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm resize-none"
            rows={2}
            placeholder="Descripción (cómo se consigue)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <p className="mt-4 mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ícono</p>
          <div className="flex flex-wrap gap-2">
            {ICON_KEYS.map((key) => {
              const Icon = ACHIEVEMENT_ICONS[key];
              const selected = key === iconKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIconKey(key)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                    selected
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Activo (visible en perfiles)
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={closeForm} disabled={busy}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={busy || !name.trim() || !description.trim()}>
              Guardar
            </Button>
          </div>
        </div>
      )}

      {achievements.length === 0 ? (
        <EmptyState icon={Trophy} title="No hay logros todavía" description="Creá el primero para poder otorgarlo a un usuario." />
      ) : (
        <div className="space-y-3">
          {achievements.map((a) => {
            const Icon = ACHIEVEMENT_ICONS[a.iconKey] ?? Trophy;
            const isOpen = expanded === a.id;
            return (
              <div key={a.id} className="overflow-hidden rounded-2xl border border-primary/10 bg-card/20">
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary">
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{a.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{a.description}</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {a._count.awards} otorgado{a._count.awards === 1 ? "" : "s"}
                  </span>
                  <StatusBadge tone={a.active ? "success" : "neutral"}>{a.active ? "Activo" : "Inactivo"}</StatusBadge>
                  <div className="inline-flex shrink-0 items-center gap-1">
                    <button
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      onClick={() => toggleExpand(a)}
                      title="Otorgar / ver usuarios"
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4" strokeWidth={1.75} /> : <Award className="h-4 w-4" strokeWidth={1.75} />}
                    </button>
                    <button
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      onClick={() => openEdit(a)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <button
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleting(a)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-primary/10 bg-background/40 px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        className="w-56 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Username a otorgar"
                        value={awardUsername}
                        onChange={(e) => setAwardUsername(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAward(a.id)}
                      />
                      <Button size="sm" onClick={() => handleAward(a.id)} disabled={awardBusy || !awardUsername.trim()}>
                        Otorgar
                      </Button>
                    </div>
                    {awardError && <p className="mt-2 text-xs text-destructive">{awardError}</p>}

                    <div className="mt-4 space-y-1.5">
                      {(holders[a.id] ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nadie tiene este logro todavía.</p>
                      ) : (
                        holders[a.id].map((h) => (
                          <div
                            key={h.userId}
                            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-primary/5"
                          >
                            <span className="text-foreground">{h.displayName || h.username}</span>
                            <button
                              onClick={() => handleRevoke(a.id, h.userId)}
                              disabled={awardBusy}
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              title="Revocar"
                            >
                              <X className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title={`Eliminar ${deleting?.name ?? ""}`}
        description="Esta acción no se puede deshacer. Los usuarios que ya lo tienen lo van a perder."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
