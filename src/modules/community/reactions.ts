import { isPublicPost } from "@/modules/editorial/publication";
import { prisma } from "@/infrastructure/database/prisma";
import { createNotification } from "@/modules/notifications/service";

export class ReactionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type ReactionTargetType = "POST" | "COMMENT";

async function resolveTarget(targetType: ReactionTargetType, targetId: string) {
  if (targetType === "POST") {
    const post = await prisma.post.findUnique({
      where: { id: targetId },
      select: {
        authorId: true,
        slug: true,
        published: true,
        archived: true,
        scheduledFor: true,
      },
    });
    if (!post || !isPublicPost(post)) return null;
    return { ownerId: post.authorId, postSlug: post.slug };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: targetId },
    include: {
      post: {
        select: {
          slug: true,
          published: true,
          archived: true,
          scheduledFor: true,
        },
      },
    },
  });
  if (!comment || comment.deletedAt || !isPublicPost(comment.post)) return null;
  return { ownerId: comment.authorId, postSlug: comment.post.slug };
}

export async function toggleReaction(
  userId: string,
  targetType: ReactionTargetType,
  targetId: string,
) {
  if (targetType !== "POST" && targetType !== "COMMENT") {
    throw new ReactionError("Tipo de reacción inválido");
  }

  const target = await resolveTarget(targetType, targetId);
  if (!target) throw new ReactionError("No encontrado", 404);

  const existing = await prisma.reaction.findUnique({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { userId, targetType, targetId } });
    if (target.ownerId !== userId) {
      await createNotification({
        userId: target.ownerId,
        type: "REACTION",
        actorId: userId,
        entityType: "Post",
        entityId: target.postSlug,
      });
    }
  }

  const count = await prisma.reaction.count({
    where: { targetType, targetId },
  });
  return { liked: !existing, count };
}

export async function getReactionState(
  userId: string | null,
  targetType: ReactionTargetType,
  targetId: string,
) {
  if (!(await resolveTarget(targetType, targetId)))
    throw new ReactionError("No encontrado", 404);
  const [count, mine] = await Promise.all([
    prisma.reaction.count({ where: { targetType, targetId } }),
    userId
      ? prisma.reaction.findUnique({
          where: {
            userId_targetType_targetId: { userId, targetType, targetId },
          },
        })
      : null,
  ]);
  return { count, liked: !!mine };
}
