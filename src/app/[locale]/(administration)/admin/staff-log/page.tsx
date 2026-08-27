import { requireSectionPage } from "@/modules/administration/page-guard";
import { listAdminActionLog } from "@/modules/administration/action-log";
import { ScrollText, ShieldAlert, Newspaper, Gamepad2, Users, Flag, MessageSquareWarning, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { EmptyState } from "@/modules/administration/components/ui/empty-state";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const dynamic = "force-dynamic";

function actorLabel(actor: { username: string | null; displayName: string | null; name: string | null } | null) {
  if (!actor) return "—";
  return actor.displayName || actor.name || actor.username || "—";
}

const ACTION_ICONS: [prefix: string, icon: LucideIcon][] = [
  ["sanction", ShieldAlert],
  ["post", Newspaper],
  ["modality", Gamepad2],
  ["user", Users],
  ["report", Flag],
  ["appeal", MessageSquareWarning],
];

function actionIcon(action: string): LucideIcon {
  const match = ACTION_ICONS.find(([prefix]) => action.startsWith(prefix));
  return match ? match[1] : ScrollText;
}

export default async function StaffLogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireSectionPage("staffLog", locale);

  const entries = await listAdminActionLog(200);

  return (
    <div>
      <PageHeader
        icon={SECTION_ICONS.staffLog}
        title="Registro de staff"
        description="Historial de solo lectura de cada acción administrativa: sanciones, cambios de rol, publicación/archivado de posts y revisión de reportes."
      />

      {entries.length === 0 ? (
        <EmptyState icon={ScrollText} title="Todavía no hay acciones registradas" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card/20">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Staff</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Acción</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Objetivo</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const Icon = actionIcon(e.action);
                return (
                  <tr key={e.id} className="border-b border-primary/5 transition-colors hover:bg-primary/5">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{actorLabel(e.actor)}</td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={1.75} />
                        {e.action}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground/70">
                      {e.targetType ? `${e.targetType} · ${e.targetId ?? "—"}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString("es-ES")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
