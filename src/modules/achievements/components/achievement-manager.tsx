"use client";

import { useState } from "react";
import {
  Award,
  ChevronUp,
  Gauge,
  Hand,
  MessageCircle,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/modules/administration/components/ui/empty-state";
import { StatusBadge } from "@/modules/administration/components/ui/status-badge";
import { ACHIEVEMENT_ICONS } from "@/modules/administration/components/ui/icons";
import {
  ACHIEVEMENT_TRIGGER_DEFINITIONS,
  ACHIEVEMENT_TRIGGER_KEYS,
  describeAchievementTrigger,
  type AchievementTriggerKey,
  type AchievementUnlockModeKey,
} from "@/modules/achievements/triggers";

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  order: number;
  active: boolean;
  unlockMode: AchievementUnlockModeKey;
  trigger: AchievementTriggerKey | null;
  triggerValue: number | null;
  _count: { awards: number };
}

interface Holder {
  userId: string;
  username: string | null;
  displayName: string | null;
  awardedAt: string;
  source: "MANUAL" | "AUTOMATIC";
}

const ICON_KEYS = Object.keys(ACHIEVEMENT_ICONS);

const TRIGGER_ICONS: Record<AchievementTriggerKey, typeof Trophy> = {
  GLOBAL_MESSAGES: MessageCircle,
  DIRECT_MESSAGES: MessageCircle,
  FRIENDSHIPS: Users,
  LEVEL: Gauge,
  XP: Zap,
  PROFILE_COMPLETE: Award,
  EMAIL_VERIFIED: Award,
  OAUTH_CONNECTIONS: Users,
};

export default function AchievementManager({ initialAchievements }: { initialAchievements: Achievement[] }) {
  const [achievements, setAchievements] = useState(initialAchievements);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconKey, setIconKey] = useState(ICON_KEYS[0]);
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [unlockMode, setUnlockMode] = useState<AchievementUnlockModeKey>("AUTOMATIC");
  const [trigger, setTrigger] = useState<AchievementTriggerKey>("GLOBAL_MESSAGES");
  const [triggerValue, setTriggerValue] = useState(10);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Achievement | null>(null);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [holders, setHolders] = useState<Record<string, Holder[]>>({});
  const [awardUsername, setAwardUsername] = useState("");
  const [awardBusy, setAwardBusy] = useState(false);
  const [awardError, setAwardError] = useState("");

  const selectedTrigger = ACHIEVEMENT_TRIGGER_DEFINITIONS[trigger];
  const automaticValue = selectedTrigger.kind === "boolean" ? 1 : Math.max(1, Math.floor(triggerValue || 1));

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setName("");
    setDescription("");
    setIconKey(ICON_KEYS[0]);
    setOrder(achievements.length);
    setActive(true);
    setUnlockMode("AUTOMATIC");
    setTrigger("GLOBAL_MESSAGES");
    setTriggerValue(10);
    setError("");
  }

  function openEdit(achievement: Achievement) {
    setCreating(false);
    setEditing(achievement);
    setName(achievement.name);
    setDescription(achievement.description);
    setIconKey(achievement.iconKey);
    setOrder(achievement.order);
    setActive(achievement.active);
    setUnlockMode(achievement.unlockMode);
    setTrigger(achievement.trigger ?? "GLOBAL_MESSAGES");
    setTriggerValue(achievement.triggerValue ?? 10);
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
      const isEdit = Boolean(editing);
      const response = await fetch(isEdit ? `/api/admin/achievements/${editing!.id}` : "/api/admin/achievements", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          iconKey,
          order,
          active,
          unlockMode,
          trigger: unlockMode === "AUTOMATIC" ? trigger : null,
          triggerValue: unlockMode === "AUTOMATIC" ? automaticValue : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Error al guardar");
        return;
      }
      const saved: Achievement = isEdit
        ? { ...data.achievement, _count: editing!._count }
        : { ...data.achievement, _count: { awards: 0 } };
      setAchievements((previous) =>
        (isEdit
          ? previous.map((achievement) => (achievement.id === editing!.id ? saved : achievement))
          : [...previous, saved]
        ).sort((a, b) => a.order - b.order),
      );
      closeForm();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/achievements/${deleting.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Error al eliminar");
        setDeleting(null);
        return;
      }
      setAchievements((previous) => previous.filter((achievement) => achievement.id !== deleting.id));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }

  async function toggleExpand(achievement: Achievement) {
    if (expanded === achievement.id) {
      setExpanded(null);
      return;
    }
    setExpanded(achievement.id);
    setAwardUsername("");
    setAwardError("");
    if (!holders[achievement.id]) {
      const response = await fetch(`/api/admin/achievements/${achievement.id}/holders`);
      const data = await response.json();
      if (response.ok) setHolders((previous) => ({ ...previous, [achievement.id]: data.holders }));
    }
  }

  async function handleAward(achievementId: string) {
    if (!awardUsername.trim()) return;
    setAwardBusy(true);
    setAwardError("");
    try {
      const response = await fetch("/api/admin/achievements/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: awardUsername.trim(), achievementId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAwardError(data.error || "Error al otorgar");
        return;
      }
      setAwardUsername("");
      const holdersResponse = await fetch(`/api/admin/achievements/${achievementId}/holders`);
      const holdersData = await holdersResponse.json();
      if (holdersResponse.ok) setHolders((previous) => ({ ...previous, [achievementId]: holdersData.holders }));
      setAchievements((previous) =>
        previous.map((achievement) =>
          achievement.id === achievementId
            ? { ...achievement, _count: { awards: achievement._count.awards + 1 } }
            : achievement,
        ),
      );
    } finally {
      setAwardBusy(false);
    }
  }

  async function handleRevoke(achievementId: string, targetUserId: string) {
    setAwardBusy(true);
    setAwardError("");
    try {
      const response = await fetch("/api/admin/achievements/award", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, achievementId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAwardError(data.error || "Error al revocar");
        return;
      }
      setHolders((previous) => ({
        ...previous,
        [achievementId]: (previous[achievementId] || []).filter((holder) => holder.userId !== targetUserId),
      }));
      setAchievements((previous) =>
        previous.map((achievement) =>
          achievement.id === achievementId
            ? { ...achievement, _count: { awards: Math.max(0, achievement._count.awards - 1) } }
            : achievement,
        ),
      );
    } finally {
      setAwardBusy(false);
    }
  }

  const showForm = creating || Boolean(editing);

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
        <div className="mb-6 rounded-2xl border border-primary/15 bg-card/30 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {editing ? `Editar ${editing.name}` : "Nuevo logro"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Definí la identidad del logro y elegí si lo entrega el staff o si se gana dentro de TFLives.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              placeholder="Nombre del logro"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Orden
              <input
                type="number"
                className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                value={order}
                onChange={(event) => setOrder(Number(event.target.value))}
              />
            </label>
          </div>

          <textarea
            className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
            rows={2}
            placeholder="Descripción que verá el usuario"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <div className="mt-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Cómo se obtiene</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setUnlockMode("AUTOMATIC")}
                className={`rounded-2xl border p-4 text-left transition ${
                  unlockMode === "AUTOMATIC"
                    ? "border-primary/45 bg-primary/10 ring-1 ring-primary/20"
                    : "border-border bg-background/40 hover:border-primary/25"
                }`}
              >
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Sparkles className="size-4 text-primary" aria-hidden="true" /> Automático
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  El miembro lo desbloquea al alcanzar una meta real dentro de la comunidad.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setUnlockMode("MANUAL")}
                className={`rounded-2xl border p-4 text-left transition ${
                  unlockMode === "MANUAL"
                    ? "border-primary/45 bg-primary/10 ring-1 ring-primary/20"
                    : "border-border bg-background/40 hover:border-primary/25"
                }`}
              >
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Hand className="size-4 text-primary" aria-hidden="true" /> Manual
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  El staff decide a quién otorgarlo, ideal para eventos o reconocimientos especiales.
                </span>
              </button>
            </div>
          </div>

          {unlockMode === "AUTOMATIC" && (
            <div className="mt-5 rounded-2xl border border-primary/10 bg-background/35 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Actividad que cuenta</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {ACHIEVEMENT_TRIGGER_KEYS.map((key) => {
                  const definition = ACHIEVEMENT_TRIGGER_DEFINITIONS[key];
                  const TriggerIcon = TRIGGER_ICONS[key];
                  const selected = trigger === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTrigger(key)}
                      className={`min-h-24 rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border bg-card/30 text-muted-foreground hover:border-primary/25 hover:text-foreground"
                      }`}
                    >
                      <TriggerIcon className={`mb-2 size-4 ${selected ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                      <span className="block text-sm font-medium">{definition.label}</span>
                      <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{definition.description}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-end">
                {selectedTrigger.kind === "count" ? (
                  <label className="text-sm text-muted-foreground">
                    Meta
                    <div className="mt-1 flex items-center overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary/40">
                      <input
                        type="number"
                        min={1}
                        max={1_000_000}
                        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground outline-none"
                        value={triggerValue}
                        onChange={(event) => setTriggerValue(Math.max(1, Number(event.target.value) || 1))}
                      />
                      <span className="border-l border-border px-3 text-xs text-muted-foreground">{selectedTrigger.unit}</span>
                    </div>
                  </label>
                ) : (
                  <div className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
                    Se detecta automáticamente al completarse.
                  </div>
                )}
                <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-primary">Vista previa de la condición</p>
                  <p className="mt-1 text-sm text-foreground">{describeAchievementTrigger(trigger, automaticValue)}</p>
                </div>
              </div>
            </div>
          )}

          <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ícono</p>
          <div className="flex flex-wrap gap-2">
            {ICON_KEYS.map((key) => {
              const Icon = ACHIEVEMENT_ICONS[key];
              const selected = key === iconKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIconKey(key)}
                  aria-label={`Usar ícono ${key}`}
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
                onChange={(event) => setActive(event.target.checked)}
              />
              Activo y visible
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={closeForm} disabled={busy}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmit} disabled={busy || !name.trim() || !description.trim()}>Guardar</Button>
          </div>
        </div>
      )}

      {achievements.length === 0 ? (
        <EmptyState icon={Trophy} title="No hay logros todavía" description="Creá el primero y decidí si se obtiene automáticamente o lo entrega el staff." />
      ) : (
        <div className="space-y-3">
          {achievements.map((achievement) => {
            const Icon = ACHIEVEMENT_ICONS[achievement.iconKey] ?? Trophy;
            const isOpen = expanded === achievement.id;
            const automatic = achievement.unlockMode === "AUTOMATIC" && achievement.trigger && achievement.triggerValue;
            const automaticSummary = automatic
              ? describeAchievementTrigger(achievement.trigger!, achievement.triggerValue!)
              : null;

            return (
              <div key={achievement.id} className="overflow-hidden rounded-2xl border border-primary/10 bg-card/20">
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary">
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{achievement.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${automatic ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {automatic ? "Automático" : "Manual"}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{achievement.description}</p>
                      {automaticSummary && <p className="mt-1 truncate text-xs text-primary/80">{automaticSummary}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    <span className="font-mono text-xs text-muted-foreground">
                      {achievement._count.awards} obtenido{achievement._count.awards === 1 ? "" : "s"}
                    </span>
                    <StatusBadge tone={achievement.active ? "success" : "neutral"}>{achievement.active ? "Activo" : "Inactivo"}</StatusBadge>
                    <button
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      onClick={() => toggleExpand(achievement)}
                      title={automatic ? "Ver usuarios" : "Otorgar / ver usuarios"}
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <Award className="h-4 w-4" />}
                    </button>
                    <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(achievement)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleting(achievement)} title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-primary/10 bg-background/40 px-5 py-4">
                    {achievement.unlockMode === "MANUAL" ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            className="w-56 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            placeholder="Username a otorgar"
                            value={awardUsername}
                            onChange={(event) => setAwardUsername(event.target.value)}
                            onKeyDown={(event) => event.key === "Enter" && handleAward(achievement.id)}
                          />
                          <Button size="sm" onClick={() => handleAward(achievement.id)} disabled={awardBusy || !awardUsername.trim()}>Otorgar</Button>
                        </div>
                        {awardError && <p className="mt-2 text-xs text-destructive">{awardError}</p>}
                      </>
                    ) : (
                      <div className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
                        TFLives evalúa esta meta en el servidor cuando cambia la actividad relacionada. No requiere asignación manual.
                      </div>
                    )}

                    <div className="mt-4 space-y-1.5">
                      {(holders[achievement.id] ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nadie tiene este logro todavía.</p>
                      ) : (
                        holders[achievement.id].map((holder) => (
                          <div key={holder.userId} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-primary/5">
                            <span className="text-foreground">{holder.displayName || holder.username}</span>
                            {achievement.unlockMode === "MANUAL" && (
                              <button
                                onClick={() => handleRevoke(achievement.id, holder.userId)}
                                disabled={awardBusy}
                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                title="Revocar"
                              >
                                <X className="h-3.5 w-3.5" strokeWidth={2} />
                              </button>
                            )}
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
        open={Boolean(deleting)}
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
