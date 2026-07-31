"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/shared/ui/card";

/**
 * Placeholder de "Amigos y seguidores" (spec §12, §16). El sistema de
 * amistades/seguidores es Fase 5 del orden de desarrollo — todavía no existe
 * el modelo de datos ni la lógica, así que no hay nada real que mostrar acá.
 */
export default function FriendsPlaceholder() {
  const t = useTranslations("ProfilePlaceholders");

  return (
    <Card className="p-6 h-full">
      <div className="mb-4">
        <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">
          {t("comunidad")}
        </h2>
      </div>
      <div className="flex gap-6 text-sm">
        <div>
          <p className="text-lg font-bold text-foreground">0</p>
          <p className="text-muted-foreground">{t("amigos")}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">0</p>
          <p className="text-muted-foreground">{t("seguidores")}</p>
        </div>
      </div>
    </Card>
  );
}
