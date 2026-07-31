"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/shared/ui/card";

/**
 * Placeholder de "Logros, insignias y nivel" (spec §12). Agrupa nivel junto
 * a logros/insignias porque el PDF los describe como el mismo sistema de
 * progresión — no como parte del módulo social.
 */
export default function BadgesPlaceholder() {
  const t = useTranslations("ProfilePlaceholders");

  return (
    <Card className="p-6 h-full">
      <div className="mb-4">
        <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">
          {t("logros")}
        </h2>
      </div>
      <div className="flex gap-6 text-sm mb-4">
        <div>
          <p className="text-lg font-bold text-foreground">1</p>
          <p className="text-muted-foreground">{t("nivel")}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-10 w-10 rounded-full border border-border bg-primary/10"
          />
        ))}
      </div>
    </Card>
  );
}
