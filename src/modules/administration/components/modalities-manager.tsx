"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Gamepad2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/modules/administration/components/ui/empty-state";

interface Modality {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  postsCount: number;
}

export default function ModalitiesManager({ initialModalities }: { initialModalities: Modality[] }) {
  const [modalities, setModalities] = useState(initialModalities);
  const [editing, setEditing] = useState<Modality | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Modality | null>(null);

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setName("");
    setDescription("");
    setIcon("");
    setError("");
  }

  function openEdit(modality: Modality) {
    setCreating(false);
    setEditing(modality);
    setName(modality.name);
    setDescription(modality.description ?? "");
    setIcon(modality.icon ?? "");
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
      const res = await fetch(isEdit ? `/api/modalities/${editing!.id}` : "/api/modalities", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, icon }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }
      if (isEdit) {
        setModalities((prev) =>
          prev.map((m) => (m.id === editing!.id ? { ...m, ...data.modality } : m))
        );
      } else {
        setModalities((prev) => [...prev, { ...data.modality, postsCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
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
      const res = await fetch(`/api/modalities/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al eliminar");
        setDeleting(null);
        return;
      }
      setModalities((prev) => prev.filter((m) => m.id !== deleting.id));
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
          Nueva modalidad
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border border-primary/10 bg-card/20 p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
            {editing ? `Editar ${editing.name}` : "Nueva modalidad"}
          </h2>
          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              placeholder="Ícono (emoji, opcional)"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            />
            <textarea
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              placeholder="Descripción (opcional)"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={closeForm} disabled={busy}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={busy || !name.trim()}>
              Guardar
            </Button>
          </div>
        </div>
      )}

      {modalities.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title="No hay modalidades aún"
          description="Creá la primera para poder asignarle posts."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card/20">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Modalidad</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Descripción</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Posts</th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {modalities.map((m) => (
                <tr key={m.id} className="border-b border-primary/5 transition-colors hover:bg-primary/5">
                  <td className="px-6 py-4">
                    {m.icon && <span className="mr-2">{m.icon}</span>}
                    <span className="font-medium text-foreground">{m.name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{m.description || "—"}</td>
                  <td className="px-6 py-4 font-mono text-sm tabular-nums text-muted-foreground">{m.postsCount}</td>
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
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                        onClick={() => setDeleting(m)}
                        disabled={m.postsCount > 0}
                        title={m.postsCount > 0 ? "No se puede eliminar: tiene posts asociados" : "Eliminar"}
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
