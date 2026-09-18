import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { findPublicCreator } from "@/modules/creators/service";
import { UserAvatar } from "@/modules/profiles/components/user-identity";
import { identityName } from "@/modules/profiles/types";
import SocialCard from "@/modules/social/components/social-card";
import { absoluteUrl, alternatesFor, localePath } from "@/config/site";
import { JsonLd } from "@/shared/seo/json-ld";
import { personNode } from "@/shared/seo/schema";

export const instant = false;

interface CreatorPageProps { params: Promise<{ locale: string; username: string }> }

export async function generateMetadata({ params }: CreatorPageProps): Promise<Metadata> {
  const { locale, username } = await params;
  const result = await findPublicCreator(username);
  if (!result?.creator) return { robots: { index: false, follow: false } };
  const creator = result.creator;
  const path = `/streamers/${creator.username}`;
  const title = `${identityName(creator)} (@${creator.username}) | TFLives`;
  const description = creator.headline || creator.description;
  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    openGraph: {
      type: "profile",
      url: absoluteUrl(localePath(locale, path)),
      title,
      description,
      images: creator.image ? [creator.image] : undefined,
    },
  };
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { locale, username } = await params;
  const result = await findPublicCreator(username);
  if (!result?.creator) notFound();
  const creator = result.creator;
  if (result.alias) redirect(`/${locale}/streamers/${creator.username}`);
  const t = await getTranslations("Creators");
  const name = identityName(creator);
  return <main className="min-h-screen px-4 pb-14 pt-24 sm:px-6"><JsonLd data={personNode({ locale, name, username: creator.username, description: creator.description, image: creator.image ?? undefined, path: `/streamers/${creator.username}` })} /><section className="mx-auto max-w-4xl"><Link href="/streamers" className="text-sm font-medium text-primary hover:underline">← {t("backToCreators")}</Link><div className="mt-5 overflow-hidden rounded-3xl border border-primary/15 bg-card"><div className="h-32 bg-gradient-to-br from-primary/30 via-primary/10 to-background" /><div className="relative px-5 pb-7 sm:px-8"><UserAvatar identity={creator} alt={name} className="-mt-12 size-24 border-4 border-card text-3xl shadow-lg" /><div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-3xl font-bold text-foreground">{name}</h1><span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"><BadgeCheck className="size-3.5" aria-hidden="true" />{t("creatorBadge")}</span></div><p className="mt-1 font-mono text-sm text-primary">@{creator.username}</p><span className="mt-3 inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">{t(`categoryLabels.${creator.category}`)}</span></div><Link href={`/perfil/${creator.username}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40">{t("viewProfile")}</Link></div><p className="mt-6 max-w-2xl whitespace-pre-line text-sm leading-7 text-muted-foreground">{creator.description}</p>{creator.headline && <p className="mt-3 text-base font-medium text-foreground">{creator.headline}</p>}<div className="mt-7 border-t border-border pt-5"><h2 className="font-display text-base font-bold text-foreground">{t("channels")}</h2><div className="mt-3 flex flex-wrap gap-2">{creator.platforms.map((platform) => <a key={platform.type} href={platform.url} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground hover:border-primary/40"><ExternalLink className="size-3.5 text-primary" aria-hidden="true" />{t(`platformLabels.${platform.type}`)}</a>)}</div></div><SocialCard username={creator.username} coinBalance={0} /></div></div></section></main>;
}
