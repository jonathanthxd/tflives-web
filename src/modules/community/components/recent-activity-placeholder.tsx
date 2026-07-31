"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/shared/ui/card";

/**
 * Placeholder de "Actividad reciente" (spec §12, §14). Depende del feed de
 * comunidad (comentarios, reacciones, posts) que todavía no existe.
 */
export default function RecentActivityPlaceholder() {
  const t = useTranslations("ProfilePlaceholders");

  return (
    <Card className="p-6 h-full">
      <div className="mb-4">
        <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">
          {t("actividadReciente")}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">{t("sinActividad")}</p>
    </Card>
  );
}
