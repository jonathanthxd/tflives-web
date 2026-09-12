import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { getActiveBanOrSuspension, isMuted } from "@/modules/administration/sanctions";
import { logAdminAction } from "@/modules/administration/action-log";
import { createNotification } from "@/modules/notifications/service";
import { publicIdentitySelect } from "@/modules/profiles/service";
import {
  assertReactionEmoji,
  assertRecentActionLimit,
  ChatValidationError,
  normalizeChatPayload,
  parseMentions,
  requireEnabledSticker,
} from "@/modules/chat/shared";

export { ChatValidationError } from "@/modules/chat/shared";

const AUTHOR_SELECT = publicIdentitySelect;

const MESSAGE_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  sticker: { select: { id: true, name: true, assetUrl: true, category: true } },
  replyTo: {
    include: {
      author: { select: AUTHOR_SELECT },
      sticker: { select: { id: true, name: true, assetUrl: true, category: true } },
    },
  },
  reactions: { select: { emoji: true, userId: true } },
} as const;

type GlobalMessageWithRelations = Prisma.GlobalChatMessageGetPayload<{
  include: typeof MESSAGE_INCLUDE;
}>;

function reactionSummary(
  reactions: { emoji: string; userId: string }[],
  userId: string,
) {
  const byEmoji = new Map<string, { emoji: string; count: number; mine: boolean }>();
  for (const reaction of reactions) {
    const current = byEmoji.get(reaction.emoji) ?? {
      emoji: reaction.emoji,
      count: 0,
      mine: false,
    };
    current.count += 1;
    current.mine ||= reaction.userId === userId;
    byEmoji.set(reaction.emoji, current);
  }
  return [...byEmoji.values()];
}

function publicMessage(
  message: GlobalMessageWithRelations,
  userId: string,
  blockedUserIds: Set<string>,
  canModerate: boolean,
) {
  const replyTo = message.replyTo && !blockedUserIds.has(message.replyTo.authorId)
    ? {
        id: message.replyTo.id,
        author: message.replyTo.author,
        content: message.replyTo.deletedAt && !canModerate ? "" : message.replyTo.content,
        sticker: message.replyTo.sticker,
        deletedAt: message.replyTo.deletedAt,
      }
    : null;
  return {
    id: message.id,
    authorId: message.authorId,
    author: message.author,
    content: message.deletedAt && !canModerate ? "" : message.content,
    sticker: message.sticker,
    replyTo,
    reactions: reactionSummary(message.reactions, userId),
    createdAt: message.createdAt,
    editedAt: message.editedAt,
    deletedAt: message.deletedAt,
  };
}

async function blockedByViewer(userId: string) {
  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    select: { blockedId: true },
  });
  return new Set(blocks.map((block) => block.blockedId));
}

async function viewerRole(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role ?? "USER";
}

async function cursorDate(id: string) {
  return prisma.globalChatMessage.findUnique({
    where: { id },
    select: { id: true, createdAt: true },
  });
}

export async function listGlobalMessages({
  userId,
  cursor,
  after,
  limit = 40,
}: {
  userId: string;
  cursor?: string | null;
  after?: string | null;
  limit?: number;
}) {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const [blockedUserIds, role, cursorMessage, afterMessage] = await Promise.all([
    blockedByViewer(userId),
    viewerRole(userId),
    cursor ? cursorDate(cursor) : null,
    after ? cursorDate(after) : null,
  ]);
  const canModerate = role === "MOD" || role === "ADMIN";

  if (after && afterMessage) {
    const messages = await prisma.globalChatMessage.findMany({
      where: {
        OR: [
          { createdAt: { gt: afterMessage.createdAt } },
          { createdAt: afterMessage.createdAt, id: { gt: afterMessage.id } },
        ],
      },
      include: MESSAGE_INCLUDE,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: safeLimit,
    });
    return {
      messages: messages
        .filter((message) => !blockedUserIds.has(message.authorId))
        .map((message) => publicMessage(message, userId, blockedUserIds, canModerate)),
      nextCursor: null,
      incremental: true,
    };
  }

  const messages = await prisma.globalChatMessage.findMany({
    where: cursorMessage
      ? {
          OR: [
            { createdAt: { lt: cursorMessage.createdAt } },
            { createdAt: cursorMessage.createdAt, id: { lt: cursorMessage.id } },
          ],
        }
      : undefined,
    include: MESSAGE_INCLUDE,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: safeLimit + 1,
  });
  const hasMore = messages.length > safeLimit;
  const page = messages.slice(0, safeLimit).reverse();
  return {
    messages: page
      .filter((message) => !blockedUserIds.has(message.authorId))
      .map((message) => publicMessage(message, userId, blockedUserIds, canModerate)),
    nextCursor: hasMore ? page[0]?.id ?? null : null,
    incremental: false,
  };
}

async function notifyGlobalMentions(authorId: string, content: string, messageId: string) {
  const usernames = parseMentions(content);
  if (!usernames.length) return;
  const mentioned = await prisma.user.findMany({
    where: { username: { in: usernames }, id: { not: authorId } },
    select: { id: true },
  });
  await Promise.all(
    mentioned.map((user) =>
      createNotification({
        userId: user.id,
        type: "MENTION",
        actorId: authorId,
        entityType: "GlobalChatMessage",
        entityId: messageId,
      }),
    ),
  );
}

export async function sendGlobalMessage(userId: string, payload: unknown) {
  const input = normalizeChatPayload(payload);
  if (await getActiveBanOrSuspension(userId)) {
    throw new ChatValidationError("Tu cuenta está suspendida", 403);
  }
  if (await isMuted(userId)) {
    throw new ChatValidationError("Tenés el chat silenciado", 403);
  }
  const since = new Date(Date.now() - 10_000);
  await assertRecentActionLimit({
    since,
    maximum: 5,
    message: "Estás enviando mensajes demasiado rápido. Esperá un momento.",
    count: () =>
      prisma.globalChatMessage.count({ where: { authorId: userId, createdAt: { gte: since } } }),
  });
  if (input.content) {
    const repeatedSince = new Date(Date.now() - 60_000);
    const repeated = await prisma.globalChatMessage.count({
      where: { authorId: userId, content: input.content, createdAt: { gte: repeatedSince } },
    });
    if (repeated > 0) {
      throw new ChatValidationError("No envíes el mismo mensaje repetidamente", 429);
    }
  }
  const [sticker, replyTo] = await Promise.all([
    requireEnabledSticker(input.stickerId),
    input.replyToId
      ? prisma.globalChatMessage.findUnique({
          where: { id: input.replyToId },
          select: { id: true },
        })
      : null,
  ]);
  if (input.replyToId && !replyTo) throw new ChatValidationError("Mensaje original no encontrado", 404);

  const message = await prisma.globalChatMessage.create({
    data: {
      authorId: userId,
      content: input.content,
      replyToId: replyTo?.id ?? null,
      stickerId: sticker?.id ?? null,
    },
    include: MESSAGE_INCLUDE,
  });
  await notifyGlobalMentions(userId, input.content, message.id);
  return publicMessage(message, userId, new Set(), false);
}

export async function toggleGlobalReaction(
  userId: string,
  messageId: string,
  emoji: unknown,
) {
  assertReactionEmoji(emoji);
  const message = await prisma.globalChatMessage.findFirst({
    where: { id: messageId, deletedAt: null },
    select: { id: true, authorId: true },
  });
  if (!message) throw new ChatValidationError("Mensaje no encontrado", 404);
  const since = new Date(Date.now() - 60_000);
  await assertRecentActionLimit({
    since,
    maximum: 30,
    message: "Estás reaccionando demasiado rápido. Esperá un momento.",
    count: () =>
      prisma.globalChatReaction.count({ where: { userId, createdAt: { gte: since } } }),
  });

  const existing = await prisma.globalChatReaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
  });
  if (existing) {
    await prisma.globalChatReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.globalChatReaction.create({ data: { messageId, userId, emoji } });
    if (message.authorId !== userId) {
      await createNotification({
        userId: message.authorId,
        type: "REACTION",
        actorId: userId,
        entityType: "GlobalChatMessage",
        entityId: messageId,
      });
    }
  }
  const reactions = await prisma.globalChatReaction.findMany({
    where: { messageId },
    select: { emoji: true, userId: true },
  });
  return { messageId, reactions: reactionSummary(reactions, userId) };
}

export async function markGlobalChatRead(userId: string) {
  await prisma.globalChatReadState.upsert({
    where: { userId },
    create: { userId, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });
}

export async function getGlobalChatUnreadCount(userId: string) {
  const [state, blockedUserIds] = await Promise.all([
    prisma.globalChatReadState.findUnique({ where: { userId } }),
    blockedByViewer(userId),
  ]);
  return prisma.globalChatMessage.count({
    where: {
      authorId: blockedUserIds.size
        ? { notIn: [userId, ...blockedUserIds] }
        : { not: userId },
      deletedAt: null,
      ...(state?.lastReadAt ? { createdAt: { gt: state.lastReadAt } } : {}),
    },
  });
}

export async function reportGlobalChatMessage(
  reporterId: string,
  messageId: string,
  reason: string,
  details?: string,
) {
  const cleanReason = reason.trim();
  const cleanDetails = details?.trim() || null;
  if (!cleanReason || cleanReason.length > 500 || (cleanDetails && cleanDetails.length > 2_000)) {
    throw new ChatValidationError("El reporte no es válido");
  }
  const message = await prisma.globalChatMessage.findUnique({
    where: { id: messageId },
    select: { id: true, authorId: true },
  });
  if (!message) throw new ChatValidationError("Mensaje no encontrado", 404);
  return prisma.report.create({
    data: {
      reporterId,
      targetType: "GLOBAL_CHAT_MESSAGE",
      targetId: message.id,
      targetUserId: message.authorId,
      reason: cleanReason,
      details: cleanDetails,
    },
  });
}

export async function hideGlobalChatMessage(moderatorId: string, messageId: string) {
  const message = await prisma.globalChatMessage.findUnique({ where: { id: messageId } });
  if (!message) throw new ChatValidationError("Mensaje no encontrado", 404);
  if (message.deletedAt) return message;
  const updated = await prisma.globalChatMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  });
  await logAdminAction({
    actorId: moderatorId,
    action: "global-chat.message.hide",
    targetType: "GlobalChatMessage",
    targetId: messageId,
    metadata: { authorId: message.authorId },
  });
  return updated;
}

export async function listEnabledStickers() {
  return prisma.chatSticker.findMany({
    where: { enabled: true },
    select: { id: true, name: true, assetUrl: true, category: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
}

export async function listStickersForAdmin() {
  return prisma.chatSticker.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
}

export async function saveSticker(
  input: { id?: string; name: string; assetUrl: string; enabled?: boolean; displayOrder?: number; category?: string | null },
) {
  const name = input.name.trim();
  const assetUrl = input.assetUrl.trim();
  if (!name || name.length > 80 || !/^https:\/\//i.test(assetUrl)) {
    throw new ChatValidationError("Sticker inválido");
  }
  const data = {
    name,
    assetUrl,
    enabled: input.enabled ?? true,
    displayOrder: Number.isInteger(input.displayOrder) ? input.displayOrder! : 0,
    category: input.category?.trim() || null,
  };
  if (input.id) {
    const existing = await prisma.chatSticker.findUnique({ where: { id: input.id } });
    if (!existing) throw new ChatValidationError("Sticker no encontrado", 404);
    return prisma.chatSticker.update({ where: { id: input.id }, data });
  }
  return prisma.chatSticker.create({ data });
}
