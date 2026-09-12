import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { canViewFriendsList, getSocialStatus, listFriends } from "@/modules/social/service";
import { normalizeUsername } from "@/modules/authentication/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  if (!username) return NextResponse.json({ error: "Falta username" }, { status: 400 });

  const target = await prisma.user.findFirst({
    where: { username: { equals: normalizeUsername(username), mode: "insensitive" } },
    select: { id: true, allowFriendRequests: true, friendsListVisibility: true },
  });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  const authUser = await getCurrentAuthUser();

  const isOwner = authUser?.id === target.id;
  const status = authUser
    ? await getSocialStatus(authUser.id, target.id)
    : {
        friendship: { status: "NONE" as const },
        isFollowing: false,
        friendCount: await prisma.friendship.count({
          where: { status: "ACCEPTED", OR: [{ requesterId: target.id }, { addresseeId: target.id }] },
        }),
        followerCount: await prisma.follow.count({ where: { followingId: target.id } }),
        blockedByViewer: false,
        blockedByTarget: false,
      };

  const canViewList = canViewFriendsList(
    target.friendsListVisibility,
    isOwner,
    status.friendship.status === "FRIENDS"
  );

  const friends = canViewList ? await listFriends(target.id) : [];

  return NextResponse.json({
    ...status,
    isOwner,
    canAct: !!authUser,
    allowFriendRequests: target.allowFriendRequests,
    friendsListVisibility: target.friendsListVisibility,
    canViewFriendsList: canViewList,
    friends,
  });
}
