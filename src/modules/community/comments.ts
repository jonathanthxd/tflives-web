import { publicPosts, isPublicPost } from "@/modules/editorial/publication";
import { Role } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { createNotification } from "@/modules/notifications/service";
import {
  getActiveBanOrSuspension,
  isMuted,
} from "@/modules/administration/sanctions";
import { logAdminAction } from "@/modules/administration/action-log";

export class CommentError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const AUTHOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  name: true,
  image: true,
} as const;

function extractMentionedUsernames(content: string): string[] {
  const matches = content.match(/@([a-zA-Z0-9_]{2,32})/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1)))];
}

export interface CommentDTO {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  author: {
    id: string;
    username: string | null;
    displayName: string | null;
    name: string | null;
    image: string | null;
  } | null;
  likeCount: number;
  likedByMe: boolean;
  replies: CommentDTO[];
}

export async function listComments(
  postId: string,
  viewerId?: string,
): Promise<CommentDTO[]> {
  const comments = await prisma.comment.findMany({
    where: { postId, deletedAt: null, post: publicPosts() },
    orderBy: { createdAt: "asc" },
    include: { author: { select: AUTHOR_SELECT } },
  });

  const ids = comments.map((c) => c.id);
  const [likeCounts, myLikes] = await Promise.all([
    ids.length
      ? prisma.reaction.groupBy({
          by: ["targetId"],
          where: { targetType: "COMMENT", targetId: { in: ids } },
          _count: { targetId: true },
        })
      : [],
    viewerId && ids.length
      ? prisma.reaction.findMany({
          where: {
            userId: viewerId,
            targetType: "COMMENT",
            targetId: { in: ids },
          },
          select: { targetId: true },
        })
      : [],
  ]);
  const likeCountById = new Map(
    likeCounts.map((l) => [l.targetId, l._count.targetId]),
  );
  const likedSet = new Set(myLikes.map((l) => l.targetId));

  const dtoById = new Map<string, CommentDTO>();
  for (const c of comments) {
    dtoById.set(c.id, {
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      authorId: c.authorId,
      author: c.author,
      likeCount: likeCountById.get(c.id) ?? 0,
      likedByMe: likedSet.has(c.id),
      replies: [],
    });
  }

  const topLevel: CommentDTO[] = [];
  for (const c of comments) {
    const dto = dtoById.get(c.id)!;
    if (c.parentId && dtoById.has(c.parentId)) {
      dtoById.get(c.parentId)!.replies.push(dto);
    } else if (!c.parentId) {
      topLevel.push(dto);
    }
  }
  return topLevel;
}

export async function createComment(
  authorId: string,
  postId: string,
  content: string,
  parentId: string | null,
) {
  const trimmed = content.trim();
  if (!trimmed) throw new CommentError("El comentario no puede estar vacío");
  if (trimmed.length > 2000)
    throw new CommentError("El comentario es demasiado largo");

  if (await getActiveBanOrSuspension(authorId)) {
    throw new CommentError("Tu cuenta está suspendida", 403);
  }
  if (await isMuted(authorId)) {
    throw new CommentError("Tenés el chat silenciado", 403);
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      published: true,
      archived: true,
      scheduledFor: true,
      slug: true,
    },
  });
  if (!post || !isPublicPost(post))
    throw new CommentError("Post no encontrado", 404);

  let parent = null;
  if (parentId) {
    parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.postId !== postId || parent.deletedAt) {
      throw new CommentError("No se puede responder a este comentario", 404);
    }
    if (parent.parentId) {
      throw new CommentError(
        "Solo se puede responder hasta un nivel de profundidad",
      );
    }
  }

  const comment = await prisma.comment.create({
    data: { postId, authorId, content: trimmed, parentId: parentId ?? null },
    include: { author: { select: AUTHOR_SELECT } },
  });

  if (parent && parent.authorId !== authorId) {
    await createNotification({
      userId: parent.authorId,
      type: "REPLY",
      actorId: authorId,
      entityType: "Post",
      entityId: post.slug,
    });
  }

  const mentionedUsernames = extractMentionedUsernames(trimmed);
  if (mentionedUsernames.length) {
    const mentionedUsers = await prisma.user.findMany({
      where: { username: { in: mentionedUsernames } },
      select: { id: true },
    });
    await Promise.all(
      mentionedUsers
        .filter((u) => u.id !== authorId && u.id !== parent?.authorId)
        .map((u) =>
          createNotification({
            userId: u.id,
            type: "MENTION",
            actorId: authorId,
            entityType: "Post",
            entityId: post.slug,
          }),
        ),
    );
  }

  const dto: CommentDTO = {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    authorId: comment.authorId,
    author: comment.author,
    likeCount: 0,
    likedByMe: false,
    replies: [],
  };
  return dto;
}

export async function deleteComment(
  actingUserId: string,
  actingRole: Role,
  commentId: string,
) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.deletedAt)
    throw new CommentError("Comentario no encontrado", 404);

  const isOwner = comment.authorId === actingUserId;
  const isStaff = actingRole === "MOD" || actingRole === "ADMIN";
  if (!isOwner && !isStaff)
    throw new CommentError("No podés borrar este comentario", 403);

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });

  if (!isOwner) {
    await logAdminAction({
      actorId: actingUserId,
      action: "comment.delete",
      targetType: "Comment",
      targetId: commentId,
      metadata: { authorId: comment.authorId, postId: comment.postId },
    });
  }

  return updated;
}
