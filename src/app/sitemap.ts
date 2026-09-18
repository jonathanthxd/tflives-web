import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { absoluteUrl, localePath } from "@/config/site";
import { routing } from "@/i18n/routing";
import { prisma } from "@/infrastructure/database/prisma";
import {
  publicModalities,
  publicPosts,
  publicWiki,
} from "@/modules/editorial/publication";
import { staticSeoRoutes, type StaticSeoRoute } from "@/shared/seo/routes";

type SitemapEntry = {
  path: string;
  lastModified?: Date;
  changeFrequency?: StaticSeoRoute["changeFrequency"];
  priority?: number;
};

function sitemapLanguages(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(localePath(locale, path));
  }
  languages["x-default"] = absoluteUrl(
    localePath(routing.defaultLocale, path),
  );
  return languages;
}

async function dynamicEntries(): Promise<SitemapEntry[]> {
  const [posts, wiki, modalities, creators, users] = await Promise.allSettled([
    prisma.post.findMany({
      where: publicPosts(),
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.wikiArticle.findMany({
      where: publicWiki(),
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.modality.findMany({
      where: publicModalities,
      select: { slug: true, updatedAt: true },
      orderBy: { order: "asc" },
      take: 2000,
    }),
    prisma.creatorProfile.findMany({
      where: { status: "ACTIVE", user: { username: { not: null } } },
      select: { updatedAt: true, user: { select: { username: true } } },
      orderBy: { acceptedAt: "desc" },
      take: 2000,
    }),
    prisma.user.findMany({
      where: { username: { not: null } },
      select: { username: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
  ]);

  const entries: SitemapEntry[] = [];

  if (posts.status === "fulfilled") {
    for (const post of posts.value) {
      entries.push({
        path: `/network/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }
  if (wiki.status === "fulfilled") {
    for (const article of wiki.value) {
      entries.push({
        path: `/network/wiki/${article.slug}`,
        lastModified: article.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }
  if (modalities.status === "fulfilled") {
    for (const modality of modalities.value) {
      entries.push({
        path: `/network/modalidades/${modality.slug}`,
        lastModified: modality.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }
  if (creators.status === "fulfilled") {
    for (const creator of creators.value) {
      if (!creator.user.username) continue;
      entries.push({
        path: `/streamers/${creator.user.username}`,
        lastModified: creator.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }
  if (users.status === "fulfilled") {
    for (const user of users.value) {
      if (!user.username) continue;
      entries.push({
        path: `/perfil/${user.username}`,
        lastModified: user.updatedAt,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const entries: SitemapEntry[] = [
    ...staticSeoRoutes,
    ...(await dynamicEntries()),
  ];

  const sitemap: MetadataRoute.Sitemap = [];
  for (const entry of entries) {
    const languages = sitemapLanguages(entry.path);
    for (const locale of routing.locales) {
      sitemap.push({
        url: absoluteUrl(localePath(locale, entry.path)),
        lastModified: entry.lastModified,
        changeFrequency: entry.changeFrequency,
        priority: entry.priority,
        alternates: { languages },
      });
    }
  }
  return sitemap;
}
