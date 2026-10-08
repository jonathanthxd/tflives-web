"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CosmeticPreviewScene } from "@/modules/cosmetics/components/cosmetic-renderer";
import { toSafeCosmeticVisual, type SafeCosmeticVisual } from "@/modules/cosmetics/visuals";
import type { StudioIdentity } from "./studio-menu";

type EquippedPreview = SafeCosmeticVisual & { id: string; name: string; nameEn: string };
export default function StudioCosmeticsPanel({ identity }: { identity?: StudioIdentity }) {
  const t = useTranslations("StudioV2");
  const locale = useLocale();
  const username = identity?.username;
  const [result, setResult] = useState<{ username: string; items: EquippedPreview[]; failed: boolean } | null>(null);
  useEffect(() => {
    if (!username) return;
    const controller = new AbortController();
    void fetch("/api/account/cosmetics", { signal: controller.signal, cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Account cosmetics unavailable");
      const payload = await response.json();
      const items: EquippedPreview[] = [];
      if (Array.isArray(payload.inventory)) for (const entry of payload.inventory) {
        const visual = toSafeCosmeticVisual(entry);
        if (!visual || !entry.owned || !entry.equipped || (entry.premiumOnly && payload.premium !== true)) continue;
        if (typeof entry.id !== "string" || typeof entry.name !== "string" || typeof entry.nameEn !== "string") continue;
        items.push({ ...visual, id: entry.id, name: entry.name, nameEn: entry.nameEn });
      }
      if (!controller.signal.aborted) setResult({ username, items, failed: false });
    }).catch(() => { if (!controller.signal.aborted) setResult({ username, items: [], failed: true }); });
    return () => controller.abort();
  }, [username]);
  if (!username) return <div className="space-y-3"><p className="text-sm leading-6 text-muted-foreground">{t("loginCosmeticsHint")}</p><Link href="/login" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm text-primary">{t("login")}</Link></div>;
  if (result?.username !== username) return <p role="status" className="text-xs text-muted-foreground">{t("loading")}</p>;
  if (result.failed) return <p role="alert" className="text-xs text-destructive">{t("cosmeticsError")}</p>;
  return <div className="space-y-4" data-studio-equipped>
    <p className="text-xs text-muted-foreground">{t("equippedOnly")}</p>
    {result.items.map((item) => <div key={item.id} className="rounded-2xl border border-border p-2"><CosmeticPreviewScene type={item.type} preset={item.visualPreset} /><div className="flex min-h-11 items-center justify-between gap-2 px-2"><span className="text-xs font-semibold">{locale === "en" ? item.nameEn : item.name}</span><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">{t("equipped")}</span></div></div>)}
    {!result.items.length && <p className="text-xs leading-5 text-muted-foreground">{t("nothingEquipped")}</p>}
  </div>;
}
