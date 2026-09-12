"use client";

import { BadgeCheck, ExternalLink, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { UserAvatar } from "@/modules/profiles/components/user-identity";
import { identityName } from "@/modules/profiles/types";
import type { PublicCreator } from "@/modules/creators/service";

export default function CreatorCard({ creator }: { creator: PublicCreator }) {
  const t = useTranslations("Creators");
  const name = identityName(creator);
  return (
    <article className="group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border border-primary/10 bg-card/50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
      {creator.featured && <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300"><Star className="size-3 fill-current" aria-hidden="true" />{t("featured")}</span>}
      <div className="flex items-center gap-3 pr-20">
        <UserAvatar identity={creator} alt={name} className="size-14 text-xl" />
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-bold text-foreground">{name}</h2>
          <p className="truncate font-mono text-xs text-primary">@{creator.username}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300"><BadgeCheck className="size-3" aria-hidden="true" />{t("creatorBadge")}</span>
        <span className="rounded-full border border-border bg-background/50 px-2 py-1 text-[11px] text-muted-foreground">{t(`categoryLabels.${creator.category}`)}</span>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{creator.headline || creator.description}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {creator.platforms.slice(0, 3).map((platform) => <span key={platform.type} className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">{t(`platformLabels.${platform.type}`)}</span>)}
        </div>
        <Link href={`/streamers/${creator.username}`} aria-label={`${t("viewCreator")}: ${name}`} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">{t("viewCreator")}<ExternalLink className="size-3.5" aria-hidden="true" /></Link>
      </div>
    </article>
  );
}
