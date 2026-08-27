"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, UsersRound } from "lucide-react";
import { Button } from "@/shared/ui/button";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/modules/administration/components/ui/empty-state";
import { StatusBadge } from "@/modules/administration/components/ui/status-badge";

interface TeamMember {
  id: string;
  name: string;
  roleTitle: string;
  avatarUrl: string | null;
  order: number;
  active: boolean;
}

export default function TeamManager({ initialMembers }: { initialMembers: TeamMember[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<TeamMember | null>(null);

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setName("");
    setRoleTitle("");
    setAvatarUrl("");
    setOrder(members.length);
    setActive(true);
    setError("");
  }

  function openEdit(member: TeamMember) {
    setCreating(false);
    setEditing(member);
    setName(member.name);
    setRoleTitle(member.roleTitle);
    setAvatarUrl(member.avatarUrl ?? "");
    setOrder(member.order);
    setActive(member.active);
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
      const res = await fetch(isEdit ? `/api/admin/team/${editing!.id}` : "/api/admin/team", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, roleTitle, avatarUrl, order, active }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }
      if (isEdit) {
        setMembers((prev) =>
          prev
            .map((m) => (m.id === editing!.id ? data.member : m))
            .sort((a, b) => a.order - b.order)
        );
      } else {
        setMembers((prev) => [...prev, data.member].sort((a, b) => a.order - b.order));
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
      const res = await fetch(`/api/admin/team/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al eliminar");
        setDeleting(null);
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== deleting.id));
      setDeleting(null);
    } finally {
      setBusy(false);
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
          Nuevo miembro
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border border-primary/10 bg-card/20 p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
            {editing ? `Editar ${editing.name}` : "Nuevo miembro del equipo"}
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
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              placeholder="Cargo (ej. Owner, Community Manager)"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
            />
          </div>
          <input
            className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
            placeholder="URL de avatar (opcional — si no hay, se muestra la inicial)"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Orden
              <input
                type="number"
                className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Visible en el sitio
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={closeForm} disabled={busy}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={busy || !name.trim() || !roleTitle.trim()}>
              Guardar
            </Button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No hay miembros del equipo todavía"
          description="Agregá el primero para que aparezca en el home."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card/20">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Miembro</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Cargo</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Orden</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-primary/5 transition-colors hover:bg-primary/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} alt={m.name} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-xs font-semibold text-primary">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-foreground">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{m.roleTitle}</td>
                  <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{m.order}</td>
                  <td className="px-6 py-4">
                    <StatusBadge tone={m.active ? "success" : "neutral"}>
                      {m.active ? "Visible" : "Oculto"}
                    </StatusBadge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        onClick={() => openEdit(m)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                      <button
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleting(m)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title={`Eliminar ${deleting?.name ?? ""}`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
