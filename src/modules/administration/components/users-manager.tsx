"use client";

import { useState, useMemo } from "react";
import { Search, ExternalLink, Eye, ShieldAlert, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/modules/administration/components/ui/empty-state";

type Role = "USER" | "MOD" | "ADMIN";

interface UserRow {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
  email: string;
  image: string | null;
  role: Role;
  createdAt: string;
}

const ROLE_LABELS: Record<Role, string> = { USER: "Usuario", MOD: "Moderador", ADMIN: "Administrador" };

const ROLE_RING: Record<Role, string> = {
  USER: "border-border",
  MOD: "border-amber-500/40 text-amber-600 dark:text-amber-400",
  ADMIN: "border-primary/50 text-primary",
};

export default function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRow[];
  currentUserId: string;
}) {
  const t = useTranslations("AdminPlatform");
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingChange, setPendingChange] = useState<{ user: UserRow; role: Role } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.username, u.displayName, u.name, u.email].some((f) => f?.toLowerCase().includes(q))
    );
  }, [users, query]);

  async function confirmRoleChange() {
    if (!pendingChange) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${pendingChange.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: pendingChange.role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al cambiar el rol");
        setPendingChange(null);
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === pendingChange.user.id ? { ...u, role: pendingChange.role } : u))
      );
      setPendingChange(null);
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

      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" strokeWidth={1.75} />
        <input
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary/40"
          placeholder="Buscar por usuario, nombre o email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No se encontraron usuarios" description="Probá con otro término de búsqueda." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card/20">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Rol</th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const label = u.displayName || u.name || u.username || "—";
                return (
                  <tr key={u.id} className="border-b border-primary/5 transition-colors hover:bg-primary/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-xs font-semibold text-primary">
                          {label.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{label}</div>
                          {u.username && <div className="truncate text-xs text-muted-foreground/50">@{u.username}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      <select
                        className={`rounded-lg border bg-background px-3 py-1.5 text-sm font-medium outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${ROLE_RING[u.role]}`}
                        value={u.role}
                        disabled={u.id === currentUserId}
                        onChange={(e) => setPendingChange({ user: u, role: e.target.value as Role })}
                      >
                        {(["USER", "MOD", "ADMIN"] as Role[]).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                          title={t("viewOverview")}
                          aria-label={t("viewOverview")}
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.75} />
                        </Link>
                        {u.username && (
                          <Link
                            href={`/perfil/${u.username}`}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            title="Ver perfil"
                          >
                            <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                          </Link>
                        )}
                        <Link
                          href="/admin/moderation"
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
                          title="Sancionar"
                        >
                          <ShieldAlert className="h-4 w-4" strokeWidth={1.75} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingChange}
        title="Cambiar rol"
        description={
          pendingChange
            ? `¿Cambiar el rol de ${pendingChange.user.displayName || pendingChange.user.username || pendingChange.user.email} a ${ROLE_LABELS[pendingChange.role]}?`
            : undefined
        }
        confirmLabel="Cambiar"
        cancelLabel="Cancelar"
        busy={busy}
        onConfirm={confirmRoleChange}
        onCancel={() => setPendingChange(null)}
      />
    </div>
  );
}
