import { prisma } from "@/infrastructure/database/prisma";
import { createNotification } from "@/modules/notifications/service";
import { areFriends } from "@/modules/social/service";
import { getActiveBanOrSuspension, isMuted } from "@/modules/administration/sanctions";
import {
  assertReactionEmoji,
  assertRecentActionLimit,
  ChatValidationError,
  normalizeChatPayload,
  parseMentions,
  requireEnabledSticker,
} from "@/modules/chat/shared";

export class MessagingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const PARTICIPANT_SELECT = {
  id: true,
  username: true,
  displayName: true,
  name: true,
  image: true,
} as const;

const DIRECT_MESSAGE_INCLUDE = {
  sender: { select: PARTICIPANT_SELECT },
  sticker: { select: { id: true, name: true, assetUrl: true, category: true } },
  replyTo: {
    include: {
      sender: { select: PARTICIPANT_SELECT },
      sticker: { select: { id: true, name: true, assetUrl: true, category: true } },
    },
  },
  reactions: { select: { emoji: true, userId: true } },
} as const;

function asMessagingError(error: unknown): never {
  if (error instanceof MessagingError) throw error;
  if (error instanceof ChatValidationError) throw new MessagingError(error.message, error.status);
  throw error;
}

function summariseReactions(reactions: { emoji: string; userId: string }[], userId: string) {
  const result = new Map<string, { emoji: string; count: number; mine: boolean }>();
  for (const reaction of reactions) {
    const summary = result.get(reaction.emoji) ?? { emoji: reaction.emoji, count: 0, mine: false };
    summary.count += 1;
    summary.mine ||= reaction.userId === userId;
    result.set(reaction.emoji, summary);
  }
  return [...result.values()];
}

function serialiseDirectMessage(
  message: {
    id: string; conversationId: string; senderId: string; content: string; createdAt: Date;
    editedAt: Date | null; deletedAt: Date | null;
    sender: { id: string; username: string | null; displayName: string | null; name: string; image: string | null };
    sticker: { id: string; name: string; assetUrl: string; category: string | null } | null;
    replyTo: { id: string; sender: { id: string; username: string | null; displayName: string | null; name: string; image: string | null }; content: string; deletedAt: Date | null; sticker: { id: string; name: string; assetUrl: string; category: string | null } | null } | null;
    reactions: { emoji: string; userId: string }[];
  },
  userId: string,
) {
  return {
    id: message.id, conversationId: message.conversationId, senderId: message.senderId, sender: message.sender,
    content: message.deletedAt ? "" : message.content, sticker: message.sticker,
    replyTo: message.replyTo ? {
      id: message.replyTo.id, sender: message.replyTo.sender,
      content: message.replyTo.deletedAt ? "" : message.replyTo.content,
      sticker: message.replyTo.sticker, deletedAt: message.replyTo.deletedAt,
    } : null,
    reactions: summariseReactions(message.reactions, userId),
    createdAt: message.createdAt, editedAt: message.editedAt, deletedAt: message.deletedAt,
  };
}

async function isBlockedEitherWay(userAId: string, userBId: string) {
  return !!(await prisma.block.findFirst({ where: { OR: [
    { blockerId: userAId, blockedId: userBId }, { blockerId: userBId, blockedId: userAId },
  ] } }));
}

async function requireParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
  if (!participant || participant.status === "LEFT") throw new MessagingError("No formás parte de esta conversación", 403);
  return participant;
}

async function requireActiveParticipant(conversationId: string, userId: string) {
  const participant = await requireParticipant(conversationId, userId);
  if (participant.status !== "ACTIVE") throw new MessagingError("Aceptá la solicitud antes de interactuar", 403);
  return participant;
}

async function directConversationIsBlocked(conversationId: string, senderId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: { where: { userId: { not: senderId }, status: { not: "LEFT" } } } },
  });
  if (!conversation) throw new MessagingError("Conversación no encontrada", 404);
  if (conversation.isGroup) return false;
  return !!conversation.participants[0] && isBlockedEitherWay(senderId, conversation.participants[0].userId);
}

export async function startOrGetDirectConversation(senderId: string, targetUsername: string) {
  const target = await prisma.user.findUnique({ where: { username: targetUsername.trim().toLowerCase() }, select: { id: true } });
  if (!target) throw new MessagingError("Usuario no encontrado", 404);
  if (target.id === senderId) throw new MessagingError("No podés escribirte a vos mismo");
  if (await getActiveBanOrSuspension(senderId)) throw new MessagingError("Tu cuenta está suspendida", 403);
  if (await isBlockedEitherWay(senderId, target.id)) throw new MessagingError("No podés iniciar esta conversación", 403);
  const existing = await prisma.conversation.findFirst({
    where: { isGroup: false, participants: { some: { userId: senderId } }, AND: { participants: { some: { userId: target.id } } } },
  });
  if (existing) return existing;
  const requestSince = new Date(Date.now() - 15 * 60_000);
  try {
    await assertRecentActionLimit({
      since: requestSince,
      maximum: 5,
      message: "Estás iniciando conversaciones demasiado rápido. Esperá un momento.",
      count: () => prisma.conversation.count({
        where: { createdById: senderId, isGroup: false, createdAt: { gte: requestSince } },
      }),
    });
  } catch (error) { asMessagingError(error); }
  const friends = await areFriends(senderId, target.id);
  return prisma.conversation.create({ data: {
    isGroup: false, createdById: senderId,
    participants: { create: [
      { userId: senderId, role: "MEMBER", status: "ACTIVE" },
      { userId: target.id, role: "MEMBER", status: friends ? "ACTIVE" : "PENDING" },
    ] },
  } });
}

export async function createGroup(creatorId: string, name: string | null, memberUsernames: string[]) {
  const cleanName = name?.trim() || null;
  if (cleanName && cleanName.length > 80) throw new MessagingError("El nombre del grupo es demasiado largo");
  const uniqueUsernames = [...new Set(memberUsernames.map((value) => value.trim().toLowerCase()).filter(Boolean))];
  if (!uniqueUsernames.length) throw new MessagingError("Elegí al menos un amigo para el grupo");
  if (uniqueUsernames.length > 29) throw new MessagingError("Los grupos admiten hasta 30 miembros");
  if (await getActiveBanOrSuspension(creatorId)) throw new MessagingError("Tu cuenta está suspendida", 403);
  const since = new Date(Date.now() - 15 * 60_000);
  try {
    await assertRecentActionLimit({ since, maximum: 5, message: "Estás creando grupos demasiado rápido. Esperá un momento.", count: () => prisma.conversation.count({ where: { createdById: creatorId, isGroup: true, createdAt: { gte: since } } }) });
  } catch (error) { asMessagingError(error); }
  const members = await prisma.user.findMany({ where: { username: { in: uniqueUsernames } }, select: { id: true, username: true } });
  if (members.length !== uniqueUsernames.length) throw new MessagingError("Alguno de los usuarios no existe", 404);
  for (const member of members) {
    if (member.id === creatorId) continue;
    if (!(await areFriends(creatorId, member.id))) throw new MessagingError(`Solo podés agregar a tus amigos (@${member.username} no lo es)`, 403);
    if (await isBlockedEitherWay(creatorId, member.id)) throw new MessagingError("No podés agregar un usuario bloqueado", 403);
  }
  return prisma.conversation.create({ data: {
    isGroup: true, name: cleanName, createdById: creatorId,
    participants: { create: [
      { userId: creatorId, role: "OWNER", status: "ACTIVE" },
      ...members.filter((member) => member.id !== creatorId).map((member) => ({ userId: member.id, role: "MEMBER" as const, status: "ACTIVE" as const })),
    ] },
  } });
}

export async function addGroupMember(conversationId: string, actingUserId: string, targetUsername: string) {
  const owner = await requireActiveParticipant(conversationId, actingUserId);
  if (owner.role !== "OWNER") throw new MessagingError("Solo el creador del grupo puede agregar miembros", 403);
  const [conversation, target] = await Promise.all([
    prisma.conversation.findUnique({ where: { id: conversationId }, select: { isGroup: true } }),
    prisma.user.findUnique({ where: { username: targetUsername.trim().toLowerCase() }, select: { id: true } }),
  ]);
  if (!conversation?.isGroup) throw new MessagingError("No es un grupo", 400);
  if (!target) throw new MessagingError("Usuario no encontrado", 404);
  if (!(await areFriends(actingUserId, target.id)) || await isBlockedEitherWay(actingUserId, target.id)) throw new MessagingError("Solo podés agregar amigos que no estén bloqueados", 403);
  if (await prisma.conversationParticipant.count({ where: { conversationId, status: "ACTIVE" } }) >= 30) throw new MessagingError("El grupo alcanzó el límite de miembros");
  return prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId, userId: target.id } },
    create: { conversationId, userId: target.id, role: "MEMBER", status: "ACTIVE" },
    update: { status: "ACTIVE", joinedAt: new Date() },
  });
}

async function notifyDirectMentions(conversationId: string, senderId: string, content: string, messageId: string) {
  const usernames = parseMentions(content);
  if (!usernames.length) return;
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: senderId }, status: { in: ["ACTIVE", "PENDING"] }, user: { username: { in: usernames } } }, select: { userId: true },
  });
  await Promise.all(participants.map((participant) => createNotification({ userId: participant.userId, type: "MENTION", actorId: senderId, entityType: "DirectMessage", entityId: messageId })));
}

export async function sendMessage(conversationId: string, senderId: string, payload: unknown) {
  let input: ReturnType<typeof normalizeChatPayload>;
  try { input = normalizeChatPayload(payload, 4_000); } catch (error) { asMessagingError(error); }
  if (await getActiveBanOrSuspension(senderId)) throw new MessagingError("Tu cuenta está suspendida", 403);
  if (await isMuted(senderId)) throw new MessagingError("Tenés el chat silenciado", 403);
  await requireParticipant(conversationId, senderId);
  if (await directConversationIsBlocked(conversationId, senderId)) throw new MessagingError("No podés enviar mensajes a este usuario", 403);
  const since = new Date(Date.now() - 10_000);
  try {
    await assertRecentActionLimit({ since, maximum: 5, message: "Estás enviando mensajes demasiado rápido. Esperá un momento.", count: () => prisma.directMessage.count({ where: { senderId, createdAt: { gte: since } } }) });
  } catch (error) { asMessagingError(error); }
  if (input.content && await prisma.directMessage.count({ where: { senderId, content: input.content, createdAt: { gte: new Date(Date.now() - 60_000) } } })) throw new MessagingError("No envíes el mismo mensaje repetidamente", 429);
  let sticker: Awaited<ReturnType<typeof requireEnabledSticker>>;
  try { sticker = await requireEnabledSticker(input.stickerId); } catch (error) { asMessagingError(error); }
  if (input.replyToId) {
    const reply = await prisma.directMessage.findUnique({ where: { id: input.replyToId }, select: { conversationId: true } });
    if (!reply || reply.conversationId !== conversationId) throw new MessagingError("El mensaje original no pertenece a esta conversación", 400);
  }
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.directMessage.create({ data: { conversationId, senderId, content: input.content, replyToId: input.replyToId, stickerId: sticker?.id ?? null }, include: DIRECT_MESSAGE_INCLUDE });
    await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    await tx.conversationParticipant.update({ where: { conversationId_userId: { conversationId, userId: senderId } }, data: { lastReadAt: new Date(), status: "ACTIVE" } });
    return created;
  });
  const others = await prisma.conversationParticipant.findMany({ where: { conversationId, status: { in: ["ACTIVE", "PENDING"] }, userId: { not: senderId } }, select: { userId: true } });
  await Promise.all(others.map((participant) => createNotification({ userId: participant.userId, type: "MESSAGE", actorId: senderId, entityType: "Conversation", entityId: conversationId })));
  await notifyDirectMentions(conversationId, senderId, input.content, message.id);
  return serialiseDirectMessage(message, senderId);
}

export async function toggleDirectMessageReaction(userId: string, messageId: string, emoji: unknown) {
  try { assertReactionEmoji(emoji); } catch (error) { asMessagingError(error); }
  const message = await prisma.directMessage.findFirst({ where: { id: messageId, deletedAt: null }, select: { id: true, conversationId: true, senderId: true } });
  if (!message) throw new MessagingError("Mensaje no encontrado", 404);
  await requireActiveParticipant(message.conversationId, userId);
  const since = new Date(Date.now() - 60_000);
  try { await assertRecentActionLimit({ since, maximum: 30, message: "Estás reaccionando demasiado rápido. Esperá un momento.", count: () => prisma.directMessageReaction.count({ where: { userId, createdAt: { gte: since } } }) }); } catch (error) { asMessagingError(error); }
  const existing = await prisma.directMessageReaction.findUnique({ where: { messageId_userId_emoji: { messageId, userId, emoji } } });
  if (existing) await prisma.directMessageReaction.delete({ where: { id: existing.id } });
  else {
    await prisma.directMessageReaction.create({ data: { messageId, userId, emoji } });
    if (message.senderId !== userId) await createNotification({ userId: message.senderId, type: "REACTION", actorId: userId, entityType: "DirectMessage", entityId: messageId });
  }
  const reactions = await prisma.directMessageReaction.findMany({ where: { messageId }, select: { emoji: true, userId: true } });
  return { messageId, reactions: summariseReactions(reactions, userId) };
}

export async function openConversationRequest(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
  if (!participant || participant.status !== "PENDING") throw new MessagingError("No hay solicitud pendiente para abrir", 404);
  return prisma.conversationParticipant.update({ where: { id: participant.id }, data: { status: "ACTIVE", lastReadAt: new Date() } });
}

export async function declineConversationRequest(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
  if (!participant || participant.status !== "PENDING") throw new MessagingError("No hay solicitud pendiente para rechazar", 404);
  return prisma.conversationParticipant.update({ where: { id: participant.id }, data: { status: "LEFT" } });
}

export async function leaveConversation(conversationId: string, userId: string) {
  await requireParticipant(conversationId, userId);
  await prisma.conversationParticipant.update({ where: { conversationId_userId: { conversationId, userId } }, data: { status: "LEFT" } });
}

export async function closeGroup(conversationId: string, actingUserId: string) {
  const acting = await requireActiveParticipant(conversationId, actingUserId);
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId }, select: { isGroup: true } });
  if (!conversation?.isGroup || acting.role !== "OWNER") throw new MessagingError("Solo el creador puede cerrar el grupo", 403);
  await prisma.conversationParticipant.updateMany({ where: { conversationId, status: { not: "LEFT" } }, data: { status: "LEFT" } });
}

export async function removeGroupMember(conversationId: string, actingUserId: string, targetUserId: string) {
  const acting = await requireActiveParticipant(conversationId, actingUserId);
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId }, select: { isGroup: true } });
  if (!conversation?.isGroup || acting.role !== "OWNER") throw new MessagingError("Solo el creador del grupo puede sacar miembros", 403);
  if (targetUserId === actingUserId) throw new MessagingError("Usá salir del grupo para retirarte");
  const target = await prisma.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId: targetUserId } } });
  if (!target || target.status === "LEFT") throw new MessagingError("Miembro no encontrado", 404);
  return prisma.conversationParticipant.update({ where: { id: target.id }, data: { status: "LEFT" } });
}

export async function markConversationRead(conversationId: string, userId: string) {
  const participant = await requireParticipant(conversationId, userId);
  if (participant.status === "ACTIVE") await prisma.conversationParticipant.update({ where: { id: participant.id }, data: { lastReadAt: new Date() } });
}

export async function block(blockerId: string, targetUsername: string) {
  const target = await prisma.user.findUnique({ where: { username: targetUsername.trim().toLowerCase() }, select: { id: true } });
  if (!target) throw new MessagingError("Usuario no encontrado", 404);
  if (target.id === blockerId) throw new MessagingError("No podés bloquearte a vos mismo");
  await prisma.block.upsert({ where: { blockerId_blockedId: { blockerId, blockedId: target.id } }, create: { blockerId, blockedId: target.id }, update: {} });
}

export async function unblock(blockerId: string, targetUsername: string) {
  const target = await prisma.user.findUnique({ where: { username: targetUsername.trim().toLowerCase() }, select: { id: true } });
  if (!target) throw new MessagingError("Usuario no encontrado", 404);
  await prisma.block.deleteMany({ where: { blockerId, blockedId: target.id } });
}

export async function isBlockedByMe(userId: string, targetUsername: string) {
  const target = await prisma.user.findUnique({ where: { username: targetUsername.trim().toLowerCase() }, select: { id: true } });
  return !!target && !!(await prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: userId, blockedId: target.id } } }));
}

export async function report(reporterId: string, targetType: string, targetId: string, reason: string, details?: string) {
  const cleanReason = reason.trim(); const cleanDetails = details?.trim() || null;
  if (!cleanReason || cleanReason.length > 500 || (cleanDetails && cleanDetails.length > 2_000)) throw new MessagingError("Contá un motivo válido para el reporte");
  let targetUserId: string | null = null;
  if (targetType === "DIRECT_MESSAGE") {
    const message = await prisma.directMessage.findUnique({ where: { id: targetId }, select: { conversationId: true, senderId: true } });
    if (!message) throw new MessagingError("Mensaje no encontrado", 404);
    await requireParticipant(message.conversationId, reporterId); targetUserId = message.senderId;
  } else if (targetType === "CONVERSATION") await requireParticipant(targetId, reporterId);
  else throw new MessagingError("Tipo de reporte inválido");
  return prisma.report.create({ data: { reporterId, targetType, targetId, targetUserId, reason: cleanReason, details: cleanDetails } });
}

export interface InboxEntry {
  conversationId: string; isGroup: boolean; name: string | null; status: "ACTIVE" | "PENDING"; updatedAt: Date;
  otherParticipants: { id: string; username: string | null; displayName: string | null; name: string; image: string | null }[];
  lastMessage: { content: string; senderId: string; createdAt: Date } | null; unread: boolean;
}

export async function listInbox(userId: string): Promise<{ active: InboxEntry[]; requests: InboxEntry[]; unreadCount: number }> {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId, status: { in: ["ACTIVE", "PENDING"] } },
    include: { conversation: { include: { participants: { include: { user: { select: PARTICIPANT_SELECT } } }, messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1 } } } },
    orderBy: { conversation: { updatedAt: "desc" } },
  });
  const otherIds = participations.filter((entry) => !entry.conversation.isGroup).flatMap((entry) => entry.conversation.participants.filter((other) => other.userId !== userId).map((other) => other.userId));
  const blocks = otherIds.length ? await prisma.block.findMany({ where: { OR: [{ blockerId: userId, blockedId: { in: otherIds } }, { blockedId: userId, blockerId: { in: otherIds } }] } }) : [];
  const blockedIds = new Set(blocks.flatMap((entry) => [entry.blockerId, entry.blockedId]).filter((id) => id !== userId));
  const active: InboxEntry[] = []; const requests: InboxEntry[] = [];
  for (const participation of participations) {
    const conversation = participation.conversation; const others = conversation.participants.filter((other) => other.userId !== userId);
    if (!conversation.isGroup && others.some((other) => blockedIds.has(other.userId))) continue;
    const lastMessage = conversation.messages[0] ?? null;
    const entry: InboxEntry = {
      conversationId: conversation.id, isGroup: conversation.isGroup, name: conversation.name, status: participation.status as "ACTIVE" | "PENDING", updatedAt: conversation.updatedAt,
      otherParticipants: others.filter((other) => other.status !== "LEFT").map((other) => other.user),
      lastMessage: lastMessage ? { content: lastMessage.deletedAt ? "" : lastMessage.content, senderId: lastMessage.senderId, createdAt: lastMessage.createdAt } : null,
      unread: !!lastMessage && lastMessage.senderId !== userId && (!participation.lastReadAt || lastMessage.createdAt > participation.lastReadAt),
    };
    if (participation.status === "PENDING") requests.push(entry); else active.push(entry);
  }
  return { active, requests, unreadCount: [...active, ...requests].filter((entry) => entry.unread).length };
}

export async function getMessagingUnreadCount(userId: string) { return (await listInbox(userId)).unreadCount; }

export async function getConversation(conversationId: string, userId: string, options: { cursor?: string | null; after?: string | null; limit?: number } = {}) {
  const participant = await requireParticipant(conversationId, userId);
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 50);
  const [cursor, after] = await Promise.all([
    options.cursor ? prisma.directMessage.findUnique({ where: { id: options.cursor }, select: { id: true, conversationId: true, createdAt: true } }) : null,
    options.after ? prisma.directMessage.findUnique({ where: { id: options.after }, select: { id: true, conversationId: true, createdAt: true } }) : null,
  ]);
  const pageWhere = after?.conversationId === conversationId ? { OR: [{ createdAt: { gt: after.createdAt } }, { createdAt: after.createdAt, id: { gt: after.id } }] }
    : cursor?.conversationId === conversationId ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : undefined;
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: { include: { user: { select: PARTICIPANT_SELECT } } }, messages: { where: pageWhere, include: DIRECT_MESSAGE_INCLUDE, orderBy: after ? [{ createdAt: "asc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "desc" }], take: limit + 1 } },
  });
  if (!conversation) throw new MessagingError("Conversación no encontrada", 404);
  const hasMore = !after && conversation.messages.length > limit;
  const messages = (after ? conversation.messages.slice(0, limit) : conversation.messages.slice(0, limit).reverse()).map((message) => serialiseDirectMessage(message, userId));
  return { conversation: { ...conversation, messages }, myParticipant: participant, nextCursor: hasMore ? messages[0]?.id ?? null : null, incremental: !!after };
}
