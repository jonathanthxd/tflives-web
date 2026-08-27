import { prisma } from "@/infrastructure/database/prisma";

export interface ActivityItem {
  id: string;
  type: "COMMENT" | "LIKE";
  createdAt: Date;
  excerpt: string | null;
  postSlug: string;
  postTitle: string;
}

export async function listUserActivity(userId: string, limit = 6): Promise<ActivityItem[]> {
  const [comments, reactions] = await Promise.all([
    prisma.comment.findMany({
      where: { authorId: userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { post: { select: { slug: true, title: true } } },
    }),
    prisma.reaction.findMany({
      where: { userId, targetType: "POST" },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  const reactionPostIds = reactions.map((r) => r.targetId);
  const posts = reactionPostIds.length
    ? await prisma.post.findMany({
        where: { id: { in: reactionPostIds } },
        select: { id: true, slug: true, title: true },
      })
    : [];
  const postById = new Map(posts.map((p) => [p.id, p]));

  const items: ActivityItem[] = [
    ...comments.map((c) => ({
      id: c.id,
      type: "COMMENT" as const,
      createdAt: c.createdAt,
      excerpt: c.content.length > 140 ? `${c.content.slice(0, 140)}…` : c.content,
      postSlug: c.post.slug,
      postTitle: c.post.title,
    })),
    ...reactions
      .filter((r) => postById.has(r.targetId))
      .map((r) => {
        const post = postById.get(r.targetId)!;
        return {
          id: r.id,
          type: "LIKE" as const,
          createdAt: r.createdAt,
          excerpt: null,
          postSlug: post.slug,
          postTitle: post.title,
        };
      }),
  ];

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}
