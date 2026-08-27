import { prisma } from "@/infrastructure/database/prisma";
import { createNotification } from "@/modules/notifications/service";
import { getActiveBanOrSuspension } from "@/modules/administration/sanctions";

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

  const addressee = await prisma.user.findUnique({
    where: { id: addresseeId },
    select: { allowFriendRequests: true },
  });
  if (!addressee) throw new SocialError("Usuario no encontrado", 404);
  if (!addressee.allowFriendRequests) {
    throw new SocialError("Este usuario no acepta solicitudes de amistad", 403);
  }

  const existing = await findFriendship(requesterId, addresseeId);
  if (existing) {
    if (existing.status === "ACCEPTED") throw new SocialError("Ya son amigos");
    if (existing.status === "PENDING") throw new SocialError("Ya existe una solicitud pendiente");
    // DECLINED — se permite reintentar, se actualiza en vez de duplicar.
    const revived = await prisma.friendship.update({
      where: { id: existing.id },
      data: { requesterId, addresseeId, status: "PENDING", respondedAt: null },
    });
    await createNotification({ userId: addresseeId, type: "FRIEND_REQUEST", actorId: requesterId });
    return revived;
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId, addresseeId, status: "PENDING" },
  });
  await createNotification({ userId: addresseeId, type: "FRIEND_REQUEST", actorId: requesterId });
  return friendship;
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

  const updated = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: action === "accept" ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  });

  if (action === "accept") {
    await createNotification({
      userId: friendship.requesterId,
      type: "FRIEND_ACCEPTED",
      actorId: responderId,
    });
  }

  return updated;
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
        select: { id: true, username: true, displayName: true, name: true, image: true },
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
    select: { id: true, username: true, displayName: true, name: true, image: true },
    take: 20,
  });
}

export async function follow(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new SocialError("No podés seguirte a vos mismo");
  }
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
  const [friendship, isFollowing, friendCount, followerCount] = await Promise.all([
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
    select: { id: true, username: true, displayName: true, name: true, image: true },
  });
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
