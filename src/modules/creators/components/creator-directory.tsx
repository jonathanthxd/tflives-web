"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import CreatorCard from "@/modules/creators/components/creator-card";
import { CREATOR_CATEGORIES } from "@/modules/creators/validation";
import type { PublicCreator } from "@/modules/creators/service";

export default function CreatorDirectory({ creators, featured, canApply }: { creators: PublicCreator[]; featured: PublicCreator[]; canApply: boolean }) {
  const t = useTranslations("Creators");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const visible = useMemo(() => creators.filter((creator) => {
    const value = query.trim().replace(/^@/, "").toLowerCase();
    return (!value || creator.username.toLowerCase().includes(value) || [creator.displayName, creator.name].some((name) => name?.toLowerCase().includes(value))) && (category === "ALL" || creator.category === category);
  }), [creators, query, category]);

  return (
    <main className="min-h-screen px-4 pb-14 pt-24 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/15 via-card to-card p-7 sm:p-10">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("eyebrow")}</p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">{t("title")}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t("description")}</p></div>
            <Link href="/streamers/apply" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">{canApply ? t("apply") : t("signInToApply")}</Link>
          </div>
        </div>

        {featured.length > 0 && <section className="mt-10"><h2 className="font-display text-xl font-bold text-foreground">{t("featured")}</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{featured.map((creator) => <CreatorCard key={creator.id} creator={creator} />)}</div></section>}

        <section className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-display text-xl font-bold text-foreground">{t("allCreators")}</h2><p className="mt-1 text-sm text-muted-foreground">{creators.length}</p></div><div className="grid gap-2 sm:grid-cols-[minmax(15rem,1fr)_11rem] sm:w-[27rem]"><label className="relative"><span className="sr-only">{t("search")}</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} className="min-h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary" /></label><label><span className="sr-only">{t("category")}</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"><option value="ALL">{t("allCategories")}</option>{CREATOR_CATEGORIES.map((value) => <option key={value} value={value}>{t(`categoryLabels.${value}`)}</option>)}</select></label></div></div>
          {visible.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((creator) => <CreatorCard key={creator.id} creator={creator} />)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center"><h3 className="font-display text-lg font-semibold text-foreground">{t("emptyTitle")}</h3><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("emptyDescription")}</p></div>}
        </section>
      </section>
    </main>
  );
}
