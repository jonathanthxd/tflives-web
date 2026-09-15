"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Crown,
  ImageIcon,
  LockKeyhole,
  Palette,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { COSMETIC_PRESETS, COSMETIC_TYPES, type CosmeticTypeKey } from "@/modules/cosmetics/visuals";
import { CosmeticPreviewScene } from "@/modules/cosmetics/components/cosmetic-renderer";

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

const TYPE_ICONS: Record<CosmeticTypeKey, LucideIcon> = {
  AVATAR_FRAME: UserRound,
  PROFILE_ACCENT: Palette,
  PROFILE_BADGE: BadgeCheck,
  NAMEPLATE: Sparkles,
  BANNER_STYLE: ImageIcon,
};

function rarityClass(rarity: CosmeticView["rarity"]) {
  return {
    COMMON: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
    RARE: "border-sky-400/35 bg-sky-400/10 text-sky-700 dark:text-sky-200",
    EPIC: "border-violet-400/35 bg-violet-400/10 text-violet-700 dark:text-violet-200",
    LEGENDARY: "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-200",
  }[rarity];
}

function CosmeticPreview({ cosmetic }: { cosmetic: CosmeticView }) {
  return <CosmeticPreviewScene type={cosmetic.type} preset={cosmetic.visualPreset} />;
}

function CosmeticTile({
  cosmetic,
  authenticated,
  premium,
  busyId,
  locale,
  onMutate,
}: {
  cosmetic: CosmeticView;
  authenticated: boolean;
  premium: boolean;
  busyId: string | null;
  locale: string;
  onMutate: (cosmetic: CosmeticView, action: "purchase" | "equip" | "unequip") => void;
}) {
  const t = useTranslations("Cosmetics");
  const locked = cosmetic.premiumOnly && !premium;
  const label = locale === "en" ? cosmetic.nameEn : cosmetic.name;
  const description = locale === "en" ? cosmetic.descriptionEn : cosmetic.description;

  return (
    <Card className="cosmetics-shelf-item w-[min(82vw,18.75rem)] shrink-0 snap-start overflow-hidden p-3 sm:w-[19rem] lg:w-[20rem]">
      <CosmeticPreview cosmetic={cosmetic} />
      <div className="p-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t(`types.${cosmetic.type}`)}</p>
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${rarityClass(cosmetic.rarity)}`}>
            {t(`rarities.${cosmetic.rarity}`)}
          </span>
        </div>
        <p className="mt-3 min-h-10 text-xs leading-5 text-muted-foreground">{description}</p>
        {cosmetic.premiumOnly && (
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-200">
            <Crown className="size-3.5" aria-hidden="true" />
            {t("premiumOnly")}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
            <Coins className="size-3.5 text-primary" aria-hidden="true" />
            {new Intl.NumberFormat(locale).format(cosmetic.price)}
          </span>
          {!authenticated ? (
            <Link href="/login?redirect=/cosmeticos" className="text-xs font-semibold text-primary hover:underline">
              {t("signIn")}
            </Link>
          ) : cosmetic.equipped ? (
            <Button size="sm" className="min-h-10 sm:min-h-9" variant="outline" disabled={busyId === cosmetic.id} onClick={() => onMutate(cosmetic, "unequip")}>
              {busyId === cosmetic.id ? t("working") : <><Check className="size-3.5" aria-hidden="true" />{t("equipped")}</>}
            </Button>
          ) : cosmetic.owned ? (
            <Button size="sm" className="min-h-10 sm:min-h-9" variant="outline" disabled={locked || busyId === cosmetic.id} onClick={() => onMutate(cosmetic, "equip")}>
              {locked ? <><LockKeyhole className="size-3.5" aria-hidden="true" />{t("locked")}</> : busyId === cosmetic.id ? t("working") : t("equip")}
            </Button>
          ) : (
            <Button size="sm" className="min-h-10 sm:min-h-9" disabled={locked || busyId === cosmetic.id} onClick={() => onMutate(cosmetic, "purchase")}>
              {locked ? <><LockKeyhole className="size-3.5" aria-hidden="true" />{t("locked")}</> : busyId === cosmetic.id ? t("working") : <><Sparkles className="size-3.5" aria-hidden="true" />{t("buy")}</>}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function CosmeticShelf({
  type,
  cosmetics,
  authenticated,
  premium,
  busyId,
  locale,
  onMutate,
}: {
  type: CosmeticTypeKey;
  cosmetics: CosmeticView[];
  authenticated: boolean;
  premium: boolean;
  busyId: string | null;
  locale: string;
  onMutate: (cosmetic: CosmeticView, action: "purchase" | "equip" | "unequip") => void;
}) {
  const t = useTranslations("Cosmetics");
  const trackRef = useRef<HTMLDivElement>(null);
  const Icon = TYPE_ICONS[type];

  function nudge(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(300, track.clientWidth * 0.78), behavior: "smooth" });
  }

  return (
    <section className="cosmetics-shelf tfl-glass-soft overflow-hidden rounded-[2rem] border border-border/70">
      <div className="flex items-start gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[inset_0_1px_0_hsl(var(--foreground)/.08)]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">{t(`types.${type}`)}</h2>
            <span className="rounded-full border border-border/80 bg-background/35 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {t("collectionCount", { count: cosmetics.length })}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">{t(`collectionDescriptions.${type}`)}</p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Button type="button" size="icon-sm" variant="outline" aria-label={t("previousItems")} onClick={() => nudge(-1)}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button type="button" size="icon-sm" variant="outline" aria-label={t("nextItems")} onClick={() => nudge(1)}>
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div ref={trackRef} className="cosmetics-shelf-track flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 sm:px-6 sm:pb-6">
        {cosmetics.map((cosmetic) => (
          <CosmeticTile
            key={cosmetic.id}
            cosmetic={cosmetic}
            authenticated={authenticated}
            premium={premium}
            busyId={busyId}
            locale={locale}
            onMutate={onMutate}
          />
        ))}
      </div>
    </section>
  );
}

export default function CosmeticsCatalog({ initialData, authenticated }: { initialData: AccountCosmeticsView; authenticated: boolean }) {
  const t = useTranslations("Cosmetics");
  const locale = useLocale();
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<"catalog" | "inventory">("catalog");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const cosmetics = tab === "catalog" ? data.catalog : data.inventory;
  const groups = useMemo(
    () => COSMETIC_TYPES
      .map((type) => ({ type, cosmetics: cosmetics.filter((cosmetic) => cosmetic.type === type) }))
      .filter((group) => tab === "catalog" || group.cosmetics.length > 0),
    [cosmetics, tab],
  );

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3400);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  async function refresh() {
    const response = await fetch("/api/account/cosmetics", { cache: "no-store" });
    if (!response.ok) throw new Error("refresh");
    setData(await response.json());
  }

  async function mutate(cosmetic: CosmeticView, action: "purchase" | "equip" | "unequip") {
    setBusyId(cosmetic.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        action === "purchase" ? "/api/account/cosmetics/purchase" : "/api/account/cosmetics/equip",
        {
          method: action === "unequip" ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action === "unequip" ? { type: cosmetic.type } : { cosmeticId: cosmetic.id }),
        },
      );
      if (!response.ok) throw new Error("action");
      await refresh();
      setNotice(t(action === "purchase" ? "purchaseSuccess" : action === "equip" ? "equipSuccess" : "unequipSuccess"));
    } catch {
      setError(t("actionError"));
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
            <div role="tablist" aria-label={t("title")} className="flex rounded-xl border border-border bg-card/50 p-1">
              {(["catalog", "inventory"] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`min-h-10 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{t(value)}</button>)}
            </div>
            {tab === "inventory" && <p className="text-sm text-muted-foreground">{t("inventoryHint")}</p>}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={goBack}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("back")}
          </Button>
          <p className="hidden text-xs text-muted-foreground sm:block">{t("browseHint")}</p>
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        {notice && (
          <div className="cosmetics-inline-toast fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-primary/25 bg-background/88 px-4 py-2.5 text-sm font-medium text-foreground shadow-2xl backdrop-blur-xl" role="status">
            <span className="mr-2 inline-block size-1.5 rounded-full bg-primary align-middle shadow-[0_0_12px_hsl(var(--primary))]" />
            {notice}
          </div>
        )}

        {cosmetics.length === 0 ? (
          <Card className="mt-6 p-10 text-center text-sm text-muted-foreground">{t("empty")}</Card>
        ) : (
          <div className="mt-6 space-y-6">
            {groups.map((group) => (
              <CosmeticShelf
                key={group.type}
                type={group.type}
                cosmetics={group.cosmetics}
                authenticated={authenticated}
                premium={data.premium}
                busyId={busyId}
                locale={locale}
                onMutate={(cosmetic, action) => void mutate(cosmetic, action)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
