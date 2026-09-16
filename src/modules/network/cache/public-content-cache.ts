import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/infrastructure/database/prisma";
import {
  publicModalities,
  publicPosts,
  publicWiki,
} from "@/modules/editorial/publication";

export const PUBLIC_CONTENT_TAGS = {
  posts: "public:posts",
  modalities: "public:modalities",
  wiki: "public:wiki",
  timeline: "public:timeline",
} as const;

export async function getCachedPublicPosts({
  modalityId,
  type,
  limit = 12,
}: {
  modalityId?: string;
  type?: "MAINTENANCE";
  limit?: number;
}) {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CONTENT_TAGS.posts);

  return prisma.post.findMany({
    where: {
      ...publicPosts(),
      ...(modalityId ? { modalityId } : {}),
      ...(type ? { type } : {}),
    },
    include: { modality: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getCachedPublicModalities(limit?: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(PUBLIC_CONTENT_TAGS.modalities);

  return prisma.modality.findMany({
    where: publicModalities,
    orderBy: { order: "asc" },
    take: limit,
  });
}

export async function getCachedPublicTimeline(limit?: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(PUBLIC_CONTENT_TAGS.timeline);

  return prisma.timelineMilestone.findMany({
    where: { published: true, archived: false },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    take: limit,
  });
}

export async function getCachedWikiFilters() {
  "use cache";
  cacheLife("hours");
  cacheTag(PUBLIC_CONTENT_TAGS.wiki);
  cacheTag(PUBLIC_CONTENT_TAGS.modalities);

  const [categories, modes] = await Promise.all([
    prisma.wikiCategory.findMany({
      where: { articles: { some: publicWiki() } },
      orderBy: { order: "asc" },
    }),
    prisma.modality.findMany({
      where: publicModalities,
      orderBy: { order: "asc" },
    }),
  ]);

  return { categories, modes };
}
