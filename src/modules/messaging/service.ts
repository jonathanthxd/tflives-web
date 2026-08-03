import { prisma } from "@/infrastructure/database/prisma";
import { createNotification } from "@/modules/notifications/service";
import { areFriends } from "@/modules/social/service";

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

async function isBlockedEitherWay(userAId: string, userBId: string) {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId },
      ],
    },
  });
  return !!block;
}

async function requireParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant || participant.status === "LEFT") {
    throw new MessagingError("No formás parte de esta conversación", 403);
  }
  return participant;
}

export async function startOrGetDirectConversation(senderId: string, targetUsername: string) {
  const target = await prisma.user.findUnique({
    where: { username: targetUsername },
    select: { id: true },
  });
  if (!target) throw new MessagingError("Usuario no encontrado", 404);
  if (target.id === senderId) throw new MessagingError("No podés escribirte a vos mismo");

  if (await isBlockedEitherWay(senderId, target.id)) {
    throw new MessagingError("No podés iniciar esta conversación", 403);
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      participants: { some: { userId: senderId } },
      AND: { participants: { some: { userId: target.id } } },
    },
  });
  if (existing) return existing;

  const friends = await areFriends(senderId, target.id);

  return prisma.conversation.create({
    data: {
      isGroup: false,
      createdById: senderId,
      participants: {
        create: [
          { userId: senderId, role: "MEMBER", status: "ACTIVE" },
          { userId: target.id, role: "MEMBER", status: friends ? "ACTIVE" : "PENDING" },
        ],
      },
    },
  });
}

export async function createGroup(creatorId: string, name: string | null, memberUsernames: string[]) {
  const uniqueUsernames = [...new Set(memberUsernames)];
  if (uniqueUsernames.length === 0) {
    throw new MessagingError("Elegí al menos un amigo para el grupo");
  }

  const members = await prisma.user.findMany({
    where: { username: { in: uniqueUsernames } },
    select: { id: true, username: true },
  });
  if (members.length !== uniqueUsernames.length) {
    throw new MessagingError("Alguno de los usuarios no existe", 404);
  }

  for (const member of members) {
    if (member.id === creatorId) continue;
    if (!(await areFriends(creatorId, member.id))) {
      throw new MessagingError(`Solo podés agregar a tus amigos (@${member.username} no lo es)`, 403);
    }
  }

  return prisma.conversation.create({
    data: {
      isGroup: true,
      name,
      createdById: creatorId,
      participants: {
        create: [
          { userId: creatorId, role: "OWNER", status: "ACTIVE" },
          ...members
            .filter((m) => m.id !== creatorId)
            .map((m) => ({ userId: m.id, role: "MEMBER" as const, status: "ACTIVE" as const })),
        ],
      },
    },
  });
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) throw new MessagingError("El mensaje no puede estar vacío");
  if (trimmed.length > 4000) throw new MessagingError("El mensaje es demasiado largo");

  await requireParticipant(conversationId, senderId);

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.directMessage.create({
      data: { conversationId, senderId, content: trimmed },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    // Responder una solicitud de mensaje es, en sí mismo, abrirla.
    await tx.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: senderId } },
      data: { lastReadAt: new Date(), status: "ACTIVE" },
    });
    return created;
  });

  const others = await prisma.conversationParticipant.findMany({
    where: { conversationId, status: "ACTIVE", userId: { not: senderId } },
    select: { userId: true },
  });

  await Promise.all(
    others.map((p) =>
      createNotification({
        userId: p.userId,
        type: "MESSAGE",
        actorId: senderId,
        entityType: "Conversation",
        entityId: conversationId,
      })
    )
  );

  return message;
}

export async function openConversationRequest(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant || participant.status !== "PENDING") {
    throw new MessagingError("No hay solicitud pendiente para abrir", 404);
  }
  return prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { status: "ACTIVE" },
  });
}

export async function declineConversationRequest(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant || participant.status !== "PENDING") {
    throw new MessagingError("No hay solicitud pendiente para rechazar", 404);
  }
  return prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { status: "LEFT" },
  });
}

export async function leaveConversation(conversationId: string, userId: string) {
  await requireParticipant(conversationId, userId);
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { status: "LEFT" },
  });
}

export async function removeGroupMember(conversationId: string, actingUserId: string, targetUserId: string) {
  const acting = await requireParticipant(conversationId, actingUserId);
  if (acting.role !== "OWNER") {
    throw new MessagingError("Solo el creador del grupo puede sacar miembros", 403);
  }
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: targetUserId } },
    data: { status: "LEFT" },
  });
}

export async function markConversationRead(conversationId: string, userId: string) {
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
}

export async function block(blockerId: string, targetUsername: string) {
  const target = await prisma.user.findUnique({ where: { username: targetUsername }, select: { id: true } });
  if (!target) throw new MessagingError("Usuario no encontrado", 404);
  if (target.id === blockerId) throw new MessagingError("No podés bloquearte a vos mismo");

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId: target.id } },
    create: { blockerId, blockedId: target.id },
    update: {},
  });
}

export async function unblock(blockerId: string, targetUsername: string) {
  const target = await prisma.user.findUnique({ where: { username: targetUsername }, select: { id: true } });
  if (!target) throw new MessagingError("Usuario no encontrado", 404);
  await prisma.block.deleteMany({ where: { blockerId, blockedId: target.id } });
}

export async function isBlockedByMe(userId: string, targetUsername: string) {
  const target = await prisma.user.findUnique({ where: { username: targetUsername }, select: { id: true } });
  if (!target) return false;
  const block_ = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: userId, blockedId: target.id } },
  });
  return !!block_;
}

export async function report(reporterId: string, targetType: string, targetId: string, reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) throw new MessagingError("Contá el motivo del reporte");
  return prisma.report.create({
    data: { reporterId, targetType, targetId, reason: trimmed },
  });
}

export interface InboxEntry {
  conversationId: string;
  isGroup: boolean;
  name: string | null;
  status: "ACTIVE" | "PENDING";
  updatedAt: Date;
  otherParticipants: { id: string; username: string | null; displayName: string | null; name: string | null; image: string | null }[];
  lastMessage: { content: string; senderId: string; createdAt: Date } | null;
  unread: boolean;
}

export async function listInbox(userId: string): Promise<{ active: InboxEntry[]; requests: InboxEntry[] }> {
  const myParticipations = await prisma.conversationParticipant.findMany({
    where: { userId, status: { in: ["ACTIVE", "PENDING"] } },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: PARTICIPANT_SELECT } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  const otherUserIds = myParticipations
    .filter((p) => !p.conversation.isGroup)
    .flatMap((p) => p.conversation.participants.filter((op) => op.userId !== userId).map((op) => op.userId));

  const blocks = otherUserIds.length
    ? await prisma.block.findMany({
        where: {
          OR: [
            { blockerId: userId, blockedId: { in: otherUserIds } },
            { blockedId: userId, blockerId: { in: otherUserIds } },
          ],
        },
      })
    : [];
  const blockedUserIds = new Set(
    blocks.flatMap((b) => [b.blockerId, b.blockedId]).filter((id) => id !== userId)
  );

  const active: InboxEntry[] = [];
  const requests: InboxEntry[] = [];

  for (const p of myParticipations) {
    const conv = p.conversation;
    const otherParticipants = conv.participants.filter((op) => op.userId !== userId);

    if (!conv.isGroup && otherParticipants.some((op) => blockedUserIds.has(op.userId))) {
      continue;
    }

    const lastMessage = conv.messages[0] ?? null;
    const entry: InboxEntry = {
      conversationId: conv.id,
      isGroup: conv.isGroup,
      name: conv.name,
      status: p.status as "ACTIVE" | "PENDING",
      updatedAt: conv.updatedAt,
      otherParticipants: otherParticipants
        .filter((op) => op.status !== "LEFT")
        .map((op) => op.user),
      lastMessage: lastMessage
        ? { content: lastMessage.content, senderId: lastMessage.senderId, createdAt: lastMessage.createdAt }
        : null,
      unread: !!lastMessage && lastMessage.senderId !== userId && (!p.lastReadAt || lastMessage.createdAt > p.lastReadAt),
    };

    if (p.status === "PENDING") requests.push(entry);
    else active.push(entry);
  }

  return { active, requests };
}

export async function getConversation(conversationId: string, userId: string) {
  const participant = await requireParticipant(conversationId, userId);

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: { include: { user: { select: PARTICIPANT_SELECT } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) throw new MessagingError("Conversación no encontrada", 404);

  return { conversation, myParticipant: participant };
}
