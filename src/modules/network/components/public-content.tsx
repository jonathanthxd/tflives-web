import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/infrastructure/database/prisma";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import {
  canAccessSection,
  type AdminSection,
} from "@/modules/administration/permissions";
import {
  publicPosts,
  publicModalities,
  translated,
} from "@/modules/editorial/publication";
import PostCard from "@/modules/editorial/components/post-card";
import { UserAvatar } from "@/modules/profiles/components/user-identity";
import { identityName } from "@/modules/profiles/types";

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
export async function AreaLinks() {
  const t = await getTranslations("Content");
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
}: {
  modalityId?: string;
  type?: "MAINTENANCE";
  limit?: number;
}) {
  const [t, locale, posts] = await Promise.all([
    getTranslations("Content"),
    getLocale(),
    prisma.post.findMany({
      where: {
        ...publicPosts(),
        ...(modalityId ? { modalityId } : {}),
        ...(type ? { type } : {}),
      },
      include: { modality: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    }),
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
export async function ModalityCards({ limit }: { limit?: number }) {
  const [t, locale, modes] = await Promise.all([
    getTranslations("Content"),
    getLocale(),
    prisma.modality.findMany({
      where: publicModalities,
      orderBy: { order: "asc" },
      take: limit,
    }),
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
        return (
          <article key={member.id} className={`${panel} text-center`}>
            <Link
              href={`/perfil/${user.username}`}
              className="group mx-auto block w-fit rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              aria-label={`${t("viewProfile")} @${user.username}`}
            >
              <UserAvatar
                identity={user}
                className="mx-auto mb-4 size-24 border-2 border-primary/20 text-3xl transition-transform duration-200 group-hover:scale-[1.03]"
              />
              <h3 className="font-display text-xl font-semibold transition-colors group-hover:text-primary">
                {identityName(user)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">@{user.username}</p>
            </Link>
            <p className="mt-3 text-sm font-medium text-primary">{member.roleTitle}</p>
            {member.bio && (
              <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">
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
                    className="text-sm text-primary underline"
                  >
                    {new URL(url).hostname}
                  </a>
                ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
export async function TimelineCards({ limit }: { limit?: number }) {
  const [t, locale, items] = await Promise.all([
    getTranslations("Content"),
    getLocale(),
    prisma.timelineMilestone.findMany({
      where: { published: true, archived: false },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      take: limit,
    }),
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
