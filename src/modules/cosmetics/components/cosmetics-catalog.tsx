"use client";

import { useMemo, useState } from "react";
import { Check, Coins, Crown, LockKeyhole, Palette, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { COSMETIC_PRESETS, COSMETIC_TYPES, type CosmeticTypeKey } from "@/modules/cosmetics/visuals";

export interface CosmeticView {
  id: string;
  slug: string;
  type: CosmeticTypeKey;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  name: string;
  description: string;
  nameEn: string;
  descriptionEn: string;
  price: number;
  premiumOnly: boolean;
  active: boolean;
  visualPreset: keyof typeof COSMETIC_PRESETS;
  owned: boolean;
  equipped: boolean;
  acquiredAt?: string;
}

export interface AccountCosmeticsView {
  balance: number;
  premium: boolean;
  catalog: CosmeticView[];
  inventory: CosmeticView[];
}

function rarityClass(rarity: CosmeticView["rarity"]) {
  return {
    COMMON: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
    RARE: "border-sky-400/35 bg-sky-400/10 text-sky-700 dark:text-sky-200",
    EPIC: "border-violet-400/35 bg-violet-400/10 text-violet-700 dark:text-violet-200",
    LEGENDARY: "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-200",
  }[rarity];
}

function CosmeticPreview({ cosmetic }: { cosmetic: CosmeticView }) {
  const preset = COSMETIC_PRESETS[cosmetic.visualPreset];
  return (
    <div className="relative grid h-28 place-items-center overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted/90 via-card to-primary/10">
      <div className={`absolute -right-7 -top-7 size-24 rounded-full opacity-50 blur-2xl ${preset.preview}`} />
      {cosmetic.type === "AVATAR_FRAME" && <span className={`grid size-14 place-items-center rounded-full bg-card text-lg font-bold ring-4 ${preset.preview}`}>T</span>}
      {cosmetic.type === "PROFILE_BADGE" && <span className="grid size-12 place-items-center rounded-full border border-primary/30 bg-card text-2xl text-primary">{preset.badge}</span>}
      {cosmetic.type === "NAMEPLATE" && <span className="rounded-lg bg-violet-500/15 px-3 py-1.5 text-sm font-semibold text-violet-800 dark:text-violet-100">TFLives</span>}
      {cosmetic.type === "BANNER_STYLE" && <span className="h-12 w-24 rounded-lg bg-[linear-gradient(135deg,rgba(249,115,22,.7),rgba(236,72,153,.5),rgba(79,70,229,.65))]" />}
      {cosmetic.type === "PROFILE_ACCENT" && <span className={`size-12 rounded-full border-4 border-card shadow-lg ${preset.preview}`} />}
    </div>
  );
}

export default function CosmeticsCatalog({ initialData, authenticated }: { initialData: AccountCosmeticsView; authenticated: boolean }) {
  const t = useTranslations("Cosmetics");
  const locale = useLocale();
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<"catalog" | "inventory">("catalog");
  const [type, setType] = useState<CosmeticTypeKey | "ALL">("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const cosmetics = tab === "catalog" ? data.catalog : data.inventory;
  const filtered = useMemo(
    () => cosmetics.filter((cosmetic) => type === "ALL" || cosmetic.type === type),
    [cosmetics, type],
  );

  async function refresh() {
    const response = await fetch("/api/account/cosmetics", { cache: "no-store" });
    if (!response.ok) throw new Error("refresh");
    setData(await response.json());
  }

  async function mutate(cosmetic: CosmeticView, action: "purchase" | "equip" | "unequip") {
    setBusyId(cosmetic.id);
    setError("");
    try {
      const response = await fetch(
        action === "purchase" ? "/api/account/cosmetics/purchase" : "/api/account/cosmetics/equip",
        {
          method: action === "unequip" ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action === "unequip" ? { type: cosmetic.type } : { cosmeticId: cosmetic.id }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("actionError"));
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("actionError"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen px-4 pb-16 pt-24">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-3xl border border-primary/15 bg-card/55 p-6 shadow-[0_20px_60px_-35px_hsl(var(--primary)/.45)] sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"><Palette className="size-3.5" aria-hidden="true" />{t("eyebrow")}</div>
              <h1 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">{t("title")}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{t("description")}</p>
            </div>
            {authenticated ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 sm:text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("balance")}</p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground"><Coins className="-mt-0.5 mr-1 inline size-5 text-primary" aria-hidden="true" />{new Intl.NumberFormat(locale).format(data.balance)} <span className="text-sm text-primary">TFL</span></p>
                {data.premium && <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-200"><Crown className="size-3.5" aria-hidden="true" />{t("premiumActive")}</p>}
              </div>
            ) : (
              <Link href="/login?redirect=/cosmeticos" className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-xs font-semibold uppercase tracking-widest text-primary-foreground">{t("signIn")}</Link>
            )}
          </div>
        </section>

        {authenticated && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex rounded-xl border border-border bg-card/50 p-1">
              {(["catalog", "inventory"] as const).map((value) => <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{t(value)}</button>)}
            </div>
            {tab === "inventory" && <p className="text-sm text-muted-foreground">{t("inventoryHint")}</p>}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2" aria-label={t("filter")}>{(["ALL", ...COSMETIC_TYPES] as const).map((value) => <button key={value} type="button" onClick={() => setType(value)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${type === value ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card/50 text-muted-foreground hover:text-foreground"}`}>{value === "ALL" ? t("all") : t(`types.${value}`)}</button>)}</div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

        {filtered.length === 0 ? <Card className="mt-6 p-10 text-center text-sm text-muted-foreground">{t("empty")}</Card> : (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((cosmetic) => {
              const locked = cosmetic.premiumOnly && !data.premium;
              const label = locale === "en" ? cosmetic.nameEn : cosmetic.name;
              const description = locale === "en" ? cosmetic.descriptionEn : cosmetic.description;
              return <Card key={cosmetic.id} className="overflow-hidden p-3"><CosmeticPreview cosmetic={cosmetic} /><div className="p-2 pt-4"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold text-foreground">{label}</p><p className="mt-1 text-xs text-muted-foreground">{t(`types.${cosmetic.type}`)}</p></div><span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${rarityClass(cosmetic.rarity)}`}>{t(`rarities.${cosmetic.rarity}`)}</span></div><p className="mt-3 min-h-10 text-xs leading-5 text-muted-foreground">{description}</p>{cosmetic.premiumOnly && <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-200"><Crown className="size-3.5" aria-hidden="true" />{t("premiumOnly")}</p>}<div className="mt-4 flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground"><Coins className="size-3.5 text-primary" aria-hidden="true" />{new Intl.NumberFormat(locale).format(cosmetic.price)}</span>{!authenticated ? <Link href="/login?redirect=/cosmeticos" className="text-xs font-semibold text-primary hover:underline">{t("signIn")}</Link> : cosmetic.equipped ? <Button size="sm" variant="outline" disabled={busyId === cosmetic.id} onClick={() => void mutate(cosmetic, "unequip")}>{busyId === cosmetic.id ? t("working") : <><Check className="size-3.5" aria-hidden="true" />{t("equipped")}</>}</Button> : cosmetic.owned ? <Button size="sm" variant="outline" disabled={locked || busyId === cosmetic.id} onClick={() => void mutate(cosmetic, "equip")}>{locked ? <><LockKeyhole className="size-3.5" aria-hidden="true" />{t("locked")}</> : busyId === cosmetic.id ? t("working") : t("equip")}</Button> : <Button size="sm" disabled={locked || busyId === cosmetic.id} onClick={() => void mutate(cosmetic, "purchase")}>{locked ? <><LockKeyhole className="size-3.5" aria-hidden="true" />{t("locked")}</> : busyId === cosmetic.id ? t("working") : <><Sparkles className="size-3.5" aria-hidden="true" />{t("buy")}</>}</Button>}</div></div></Card>;
            })}
          </section>
        )}
      </div>
    </main>
  );
}
