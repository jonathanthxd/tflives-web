import { Card } from "@/shared/ui/card";

/**
 * Placeholder de "Actividad reciente" (spec §12, §14). Depende del feed de
 * comunidad (comentarios, reacciones, posts) que todavía no existe.
 */
export default function RecentActivityPlaceholder() {
  return (
    <Card className="p-6 h-full">
      <div className="mb-4">
        <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">
          Actividad reciente
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">Sin actividad todavía.</p>
    </Card>
  );
}
