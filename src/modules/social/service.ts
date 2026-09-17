import { serializableTransaction, lockUserPair } from "@/infrastructure/database/transaction";
import { prisma } from "@/infrastructure/database/prisma";
import { createNotification } from "@/modules/notifications/service";
import { getActiveBanOrSuspension } from "@/modules/administration/sanctions";
import { publicIdentitySelect } from "@/modules/profiles/service";
import { awardFriendship } from "@/modules/progression/service";

export class SocialError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function findFriendship(userAId: string, userBId: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userAId, addresseeId: userBId },
        { requesterId: userBId, addresseeId: userAId },
      ],
    },
  });
}

export async function getBlockStatus(viewerId: string, targetUserId: string) {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        { blockerId: viewerId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: viewerId },
      ],
    },
    select: { blockerId: true },
  });
  return {
    blockedByViewer: blocks.some((block) => block.blockerId === viewerId),
    blockedByTarget: blocks.some((block) => block.blockerId === targetUserId),
  };
}

async function requireNoBlock(userAId: string, userBId: string) {
  const { blockedByViewer, blockedByTarget } = await getBlockStatus(userAId, userBId);
  if (blockedByViewer || blockedByTarget) {
    throw new SocialError("No podés interactuar con un usuario bloqueado", 403);
  }
}

export async function areFriends(userAId: string, userBId: string) {
  const friendship = await findFriendship(userAId, userBId);
  return friendship?.status === "ACCEPTED";
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  if (requesterId === addresseeId) {
    throw new SocialError("No podés enviarte una solicitud a vos mismo");
  }

  if (await getActiveBanOrSuspension(requesterId)) {
    throw new SocialError("Tu cuenta está suspendida", 403);
  }

  await requireNoBlock(requesterId, addresseeId);

  const addressee = await prisma.user.findUnique({
    where: { id: addresseeId },
    select: { allowFriendRequests: true },
  });
  if (!addressee) throw new SocialError("Usuario no encontrado", 404);
  if (!addressee.allowFriendRequests) {
    throw new SocialError("Este usuario no acepta solicitudes de amistad", 403);
  }

  return serializableTransaction(async (tx) => {
  await lockUserPair(tx, requesterId, addresseeId);
  const existing = await tx.friendship.findFirst({ where: { OR: [{ requesterId, addresseeId }, { requesterId: addresseeId, addresseeId: requesterId }] } });
  if (existing) {
    if (existing.status === "ACCEPTED") throw new SocialError("Ya son amigos");
    if (existing.status === "PENDING") throw new SocialError("Ya existe una solicitud pendiente");
    // DECLINED — se permite reintentar, se actualiza en vez de duplicar.
    const revived = await tx.friendship.update({
      where: { id: existing.id },
      data: { requesterId, addresseeId, status: "PENDING", respondedAt: null },
    });
    await createNotification({ userId: addresseeId, type: "FRIEND_REQUEST", actorId: requesterId }, tx);
    return revived;
  }

  const friendship = await tx.friendship.create({
    data: { requesterId, addresseeId, status: "PENDING" },
  });
  await createNotification({ userId: addresseeId, type: "FRIEND_REQUEST", actorId: requesterId }, tx);
  return friendship;
  });
}

export async function respondToFriendRequest(
  friendshipId: string,
  responderId: string,
  action: "accept" | "decline"
) {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship) throw new SocialError("Solicitud no encontrada", 404);
  if (friendship.addresseeId !== responderId) {
    throw new SocialError("No podés responder esta solicitud", 403);
  }
  if (friendship.status !== "PENDING") {
    throw new SocialError("Esta solicitud ya fue respondida");
  }
  await requireNoBlock(friendship.requesterId, friendship.addresseeId);

  const changed = await prisma.friendship.updateMany({
    where: { id: friendshipId, status: "PENDING" },
    data: { status: action === "accept" ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  });

  if (!changed.count) throw new SocialError("Esta solicitud ya fue respondida", 409);
  if (action === "accept") {
    await Promise.all([
      createNotification({
        userId: friendship.requesterId,
        type: "FRIEND_ACCEPTED",
        actorId: responderId,
      }),
      awardFriendship(friendship.requesterId, friendship.requesterId, friendship.addresseeId),
      awardFriendship(friendship.addresseeId, friendship.requesterId, friendship.addresseeId),
    ]);
  }

  return prisma.friendship.findUniqueOrThrow({ where: { id: friendshipId } });
}

export async function removeFriendship(userId: string, otherUserId: string) {
  const friendship = await findFriendship(userId, otherUserId);
  if (!friendship || friendship.status !== "ACCEPTED") {
    throw new SocialError("No son amigos", 404);
  }
  await prisma.friendship.delete({ where: { id: friendship.id } });
}

/** Cancela una solicitud PENDING que el propio usuario envió. */
export async function cancelFriendRequest(requesterId: string, friendshipId: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship || friendship.requesterId !== requesterId || friendship.status !== "PENDING") {
    throw new SocialError("No se puede cancelar esta solicitud", 404);
  }
  await prisma.friendship.delete({ where: { id: friendshipId } });
}

export async function getFriendRequests(userId: string) {
  const [received, sent] = await Promise.all([
    prisma.friendship.findMany({
      where: { addresseeId: userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: { requesterId: userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const otherIds = [
    ...received.map((f) => f.requesterId),
    ...sent.map((f) => f.addresseeId),
  ];
  const users = otherIds.length
    ? await prisma.user.findMany({
        where: { id: { in: otherIds } },
        select: publicIdentitySelect,
      })
    : [];
  const usersById = new Map(users.map((u) => [u.id, u]));

  return {
    received: received.map((f) => ({ friendshipId: f.id, user: usersById.get(f.requesterId) ?? null })),
    sent: sent.map((f) => ({ friendshipId: f.id, user: usersById.get(f.addresseeId) ?? null })),
  };
}

export async function searchUsers(query: string, excludeUserId: string) {
  if (!query || query.trim().length < 2) return [];
  return prisma.user.findMany({
    where: {
      id: { not: excludeUserId },
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
      username: { not: null },
    },
    select: publicIdentitySelect,
    take: 20,
  });
}

export async function follow(followerId: string, followingId: string) {
  if (await getActiveBanOrSuspension(followerId)) throw new SocialError("Tu cuenta está suspendida", 403);
  if (!(await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } }))) throw new SocialError("Usuario no encontrado", 404);
  if (followerId === followingId) {
    throw new SocialError("No podés seguirte a vos mismo");
  }
  await requireNoBlock(followerId, followingId);
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });
}

export async function unfollow(followerId: string, followingId: string) {
  await prisma.follow.deleteMany({ where: { followerId, followingId } });
}

export type FriendshipRelation =
  | { status: "NONE" }
  | { status: "PENDING_SENT"; friendshipId: string }
  | { status: "PENDING_RECEIVED"; friendshipId: string }
  | { status: "FRIENDS"; friendshipId: string };

export async function getSocialStatus(viewerId: string, targetUserId: string) {
  const [friendship, isFollowing, friendCount, followerCount, blocks] = await Promise.all([
    viewerId !== targetUserId ? findFriendship(viewerId, targetUserId) : null,
    viewerId !== targetUserId
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: targetUserId } },
        })
      : null,
    prisma.friendship.count({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: targetUserId }, { addresseeId: targetUserId }],
      },
    }),
    prisma.follow.count({ where: { followingId: targetUserId } }),
    getBlockStatus(viewerId, targetUserId),
  ]);

  let relation: FriendshipRelation = { status: "NONE" };
  if (friendship) {
    if (friendship.status === "ACCEPTED") {
      relation = { status: "FRIENDS", friendshipId: friendship.id };
    } else if (friendship.status === "PENDING") {
      relation =
        friendship.requesterId === viewerId
          ? { status: "PENDING_SENT", friendshipId: friendship.id }
          : { status: "PENDING_RECEIVED", friendshipId: friendship.id };
    }
  }

  return {
    friendship: relation,
    isFollowing: !!isFollowing,
    friendCount,
    followerCount,
    ...blocks,
  };
}

export async function listFriends(targetUserId: string) {
  const friendships = await prisma.friendship.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: targetUserId }, { addresseeId: targetUserId }] },
  });
  const friendIds = friendships.map((f) => (f.requesterId === targetUserId ? f.addresseeId : f.requesterId));
  if (friendIds.length === 0) return [];
  return prisma.user.findMany({
    where: { id: { in: friendIds } },
    select: publicIdentitySelect,
  });
}

export async function listFollowers(targetUserId: string) {
  return prisma.follow.findMany({
    where: { followingId: targetUserId },
    orderBy: { createdAt: "desc" },
    select: { follower: { select: publicIdentitySelect } },
  }).then((rows) => rows.map((row) => row.follower));
}

export function canViewFriendsList(
  visibility: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE",
  isOwner: boolean,
  areFriends: boolean
) {
  if (isOwner) return true;
  if (visibility === "PUBLIC") return true;
  if (visibility === "FRIENDS_ONLY") return areFriends;
  return false;
}
