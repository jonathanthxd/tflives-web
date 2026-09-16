import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { prisma } from "@/infrastructure/database/prisma";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import {
  canAccessSection,
  type AdminSection,
} from "@/modules/administration/permissions";
import { translated } from "@/modules/editorial/publication";
import PostCard from "@/modules/editorial/components/post-card";
import { UserAvatar } from "@/modules/profiles/components/user-identity";
import { identityName } from "@/modules/profiles/types";
import { cosmeticVisualsByType, toSafeCosmeticVisual } from "@/modules/cosmetics/visuals";
import {
  CosmeticAccentLayer,
  CosmeticAvatarFrame,
  CosmeticBadge,
  CosmeticBannerLayer,
  CosmeticNameplate,
  cosmeticAccentProps,
} from "@/modules/cosmetics/components/cosmetic-renderer";
import { isEntitlementActive } from "@/modules/cosmetics/service";
import {
  getCachedPublicModalities,
  getCachedPublicPosts,
  getCachedPublicTimeline,
} from "@/modules/network/cache/public-content-cache";

export const panel = "rounded-2xl border border-primary/15 bg-card/50 p-6";
export const grid = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";
export function PublicShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="content-surface min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
        <header className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold tracking-widest text-primary">
            TIME FOR LIVES
          </p>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </header>
        {children}
      </div>
    </main>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className={`${panel} py-12 text-center text-muted-foreground`}>
      {children}
    </div>
  );
}
export function PublicSectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      aria-hidden
      className={`${panel} grid gap-4`}
      data-public-section-skeleton
    >
      {Array.from({ length: rows }, (_, index) => (
        <span
          key={index}
          className={`block h-4 rounded-full bg-muted/70 ${index === 0 ? "w-2/5" : index === rows - 1 ? "w-3/5" : "w-full"}`}
        />
      ))}
    </div>
  );
}
export async function StaffLink({
  section,
  href,
}: {
  section: AdminSection;
  href: string;
}) {
  const user = await getCurrentAuthUser();
  if (!user) return null;
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!profile || !canAccessSection(profile.role, section)) return null;
  const t = await getTranslations("Content");
  return (
    <Link
      href={href}
      className="inline-flex rounded-xl border border-primary/30 px-4 py-2 text-sm text-primary"
    >
      {t("manage")}
    </Link>
  );
}
export async function AreaLinks({ locale }: { locale?: Locale } = {}) {
  const t = locale
    ? await getTranslations({ locale, namespace: "Content" })
    : await getTranslations("Content");
  return (
    <nav className="flex flex-wrap gap-3">
      {[
        ["/network", "modalities"],
        ["/network/estado", "statusPage"],
        ["/network/wiki", "wiki"],
        ["/comunidad", "community"],
        ["/equipo", "team"],
        ["/trayectoria", "timeline"],
        ["/tienda", "shop"],
      ].map(([href, key]) => (
        <Link
          href={href}
          key={href}
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm transition-colors hover:bg-primary/10"
        >
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}
export async function PostsFeed({
  modalityId,
  type,
  limit = 12,
  locale: requestedLocale,
}: {
  modalityId?: string;
  type?: "MAINTENANCE";
  limit?: number;
  locale?: Locale;
}) {
  const [t, locale, posts] = await Promise.all([
    requestedLocale
      ? getTranslations({ locale: requestedLocale, namespace: "Content" })
      : getTranslations("Content"),
    requestedLocale ? Promise.resolve(requestedLocale) : getLocale(),
    getCachedPublicPosts({ modalityId, type, limit }),
  ]);
  if (!posts.length) return <Empty>{t("postsEmpty")}</Empty>;
  return (
    <div className={grid}>
      {posts.map((raw) => {
        const post = translated(raw, locale);
        return (
          <PostCard
            key={post.id}
            title={post.title}
            excerpt={post.excerpt ?? ""}
            type={post.type}
            modality={
              post.modality ? translated(post.modality, locale).name : "TFLives"
            }
            date={(post.publishedAt ?? post.createdAt).toLocaleDateString(
              locale,
            )}
            slug={post.slug}
            image={post.image}
          />
        );
      })}
    </div>
  );
}
export async function ModalityCards({
  limit,
  locale: requestedLocale,
}: {
  limit?: number;
  locale?: Locale;
}) {
  const [t, locale, modes] = await Promise.all([
    requestedLocale
      ? getTranslations({ locale: requestedLocale, namespace: "Content" })
      : getTranslations("Content"),
    requestedLocale ? Promise.resolve(requestedLocale) : getLocale(),
    getCachedPublicModalities(limit),
  ]);
  if (!modes.length) return <Empty>{t("modalitiesEmpty")}</Empty>;
  return (
    <div className={grid}>
      {modes.map((raw) => {
        const mode = translated(raw, locale);
        return (
          <article key={mode.id} className={`${panel} overflow-hidden`}>
            {mode.banner && (
              <img
                src={mode.banner}
                alt=""
                className="mb-5 h-36 w-full rounded-xl object-cover"
                loading="lazy"
              />
            )}
            <span className="text-xs font-medium text-primary">
              {t(mode.status)}
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold">
              <Link href={`/network/modalidades/${mode.slug}`}>
                {mode.icon} {mode.name}
              </Link>
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {mode.description}
            </p>
            {mode.minecraftVersion && (
              <p className="mt-4 text-xs text-muted-foreground">
                {t("version")}: {mode.minecraftVersion}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
export async function TeamCards({ limit }: { limit?: number }) {
  const [t, locale, members] = await Promise.all([
    getTranslations("Content"),
    getLocale(),
    prisma.teamMember.findMany({
      where: { active: true, userId: { not: null } },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            name: true,
            image: true,
            role: true,
            equippedCosmetics: {
              select: {
                type: true,
                cosmetic: {
                  select: {
                    visualPreset: true,
                    premiumOnly: true,
                  },
                },
              },
            },
            premiumEntitlements: {
              select: {
                startsAt: true,
                expiresAt: true,
                revokedAt: true,
              },
            },
          },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      take: limit,
    }),
  ]);
  const linkedMembers = members.filter((member) => !!member.user?.username);
  if (!linkedMembers.length) return <Empty>{t("teamEmpty")}</Empty>;
  return (
    <div className={grid}>
      {linkedMembers.map((raw) => {
        const member = translated(raw, locale);
        const user = raw.user;
        if (!user?.username) return null;
        const hasActivePremium = user.premiumEntitlements.some((entitlement) => isEntitlementActive(entitlement));
        const cosmetics = cosmeticVisualsByType(
          user.equippedCosmetics
            .filter((equipped) => !equipped.cosmetic.premiumOnly || hasActivePremium)
            .map((equipped) => toSafeCosmeticVisual({ type: equipped.type, visualPreset: equipped.cosmetic.visualPreset })),
        );
        const displayName = identityName(user);
        return (
          <article
            key={member.id}
            className="team-cosmetic-card relative isolate overflow-visible rounded-3xl border border-primary/15 bg-card/50 text-center shadow-[0_18px_54px_-42px_hsl(var(--primary)/0.42)]"
            {...cosmeticAccentProps(cosmetics.PROFILE_ACCENT?.visualPreset)}
          >
            <div aria-hidden className="team-cosmetic-card__surface absolute inset-0 overflow-hidden rounded-3xl">
              <CosmeticAccentLayer preset={cosmetics.PROFILE_ACCENT?.visualPreset} />
            </div>

            <div aria-hidden className="team-cosmetic-card__banner relative h-28 overflow-hidden rounded-t-3xl border-b border-white/5 bg-gradient-to-br from-primary/20 via-card/70 to-background/90">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,hsl(var(--primary)/0.18),transparent_48%)]" />
              <CosmeticBannerLayer preset={cosmetics.BANNER_STYLE?.visualPreset} />
            </div>

            <div className="relative z-[2] px-6 pb-6">
              <Link
                href={`/perfil/${user.username}`}
                className="group mx-auto -mt-12 block w-fit rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                aria-label={`${t("viewProfile")} @${user.username}`}
              >
                <CosmeticAvatarFrame preset={cosmetics.AVATAR_FRAME?.visualPreset} className="z-[3]">
                  <UserAvatar
                    identity={user}
                    alt={displayName}
                    className="size-24 border-4 border-card text-3xl shadow-xl shadow-black/20 transition-transform duration-200 group-hover:scale-[1.025]"
                  />
                </CosmeticAvatarFrame>
                <div className="mt-5 flex max-w-[17rem] items-center justify-center gap-2">
                  <h3 className="min-w-0 font-display text-xl font-semibold transition-colors group-hover:text-primary">
                    <CosmeticNameplate preset={cosmetics.NAMEPLATE?.visualPreset}>{displayName}</CosmeticNameplate>
                  </h3>
                  <CosmeticBadge preset={cosmetics.PROFILE_BADGE?.visualPreset} label="" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">@{user.username}</p>
              </Link>

              <p className="mt-3 text-sm font-medium text-primary">{member.roleTitle}</p>
              {member.bio && (
                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {member.bio}
                </p>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {member.socialLinks
                  .filter((url) => /^https:\/\//.test(url) && URL.canParse(url))
                  .map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline decoration-primary/35 underline-offset-4 transition hover:decoration-primary"
                    >
                      {new URL(url).hostname}
                    </a>
                  ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
export async function TimelineCards({
  limit,
  locale: requestedLocale,
}: {
  limit?: number;
  locale?: Locale;
}) {
  const [t, locale, items] = await Promise.all([
    requestedLocale
      ? getTranslations({ locale: requestedLocale, namespace: "Content" })
      : getTranslations("Content"),
    requestedLocale ? Promise.resolve(requestedLocale) : getLocale(),
    getCachedPublicTimeline(limit),
  ]);
  if (!items.length) return <Empty>{t("timelineEmpty")}</Empty>;
  return (
    <ol className="ml-3 space-y-8 border-l border-primary/30 pl-6 sm:pl-10">
      {items.map((raw) => {
        const item = translated(raw, locale);
        return (
          <li key={item.id} className={`relative ${panel}`}>
            <span className="absolute -left-8 top-7 h-3 w-3 rounded-full bg-primary sm:-left-12" />
            <p className="text-sm text-primary">
              {item.dateLabel} {item.category && `· ${item.category}`}
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold">
              {item.title}
            </h3>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
              {item.description}
            </p>
            {item.image && (
              <img
                src={item.image}
                alt=""
                loading="lazy"
                className="mt-5 max-h-64 w-full rounded-xl object-cover"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
