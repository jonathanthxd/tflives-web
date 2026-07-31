"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/shared/ui/card";

/**
 * Placeholder de "Cosméticos" (spec §17). Depende del sistema de economía y
 * tienda que todavía no existe.
 */
export default function CosmeticsPlaceholder() {
  const t = useTranslations("ProfilePlaceholders");

  return (
    <Card className="p-6 h-full">
      <div className="mb-4">
        <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">
          {t("cosmeticos")}
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-lg border border-border bg-primary/5"
          />
        ))}
      </div>
    </Card>
  );
}
