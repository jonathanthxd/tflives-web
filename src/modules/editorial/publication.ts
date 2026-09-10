import type { Prisma } from "@prisma/client";

/** One visibility rule for feeds, detail pages and social interactions. */
export function publicPosts(now = new Date()): Prisma.PostWhereInput {
  return {
    published: true,
    archived: false,
    OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
  };
}
export function isPublicPost(
  post: { published: boolean; archived: boolean; scheduledFor: Date | null },
  now = new Date(),
) {
  return (
    post.published &&
    !post.archived &&
    (!post.scheduledFor || post.scheduledFor <= now)
  );
}
export function publicWiki(now = new Date()): Prisma.WikiArticleWhereInput {
  return {
    OR: [
      { state: "PUBLISHED" },
      { state: "SCHEDULED", scheduledFor: { lte: now } },
    ],
  };
}
export const publicModalities = {
  published: true,
  status: { not: "ARCHIVED" as const },
};

export function translated<T extends object>(
  record: T & { translations?: unknown },
  locale: string,
): T {
  const translations = record.translations;
  if (
    !translations ||
    typeof translations !== "object" ||
    Array.isArray(translations)
  )
    return record;
  const fields = (translations as Record<string, unknown>)[locale];
  if (!fields || typeof fields !== "object" || Array.isArray(fields))
    return record;
  // Only editorial text may override a record; never state, IDs, URLs or permissions.
  const allowed = [
    "title",
    "name",
    "description",
    "content",
    "excerpt",
    "bio",
    "roleTitle",
    "dateLabel",
  ];
  return {
    ...record,
    ...Object.fromEntries(
      Object.entries(fields).filter(
        ([key, value]) =>
          allowed.includes(key) && typeof value === "string" && value.trim(),
      ),
    ),
  };
}
