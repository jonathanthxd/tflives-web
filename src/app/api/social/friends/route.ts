import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import {
  SocialError,
  cancelFriendRequest,
  getFriendRequests,
  listFriends,
  removeFriendship,
  respondToFriendRequest,
  sendFriendRequest,
} from "@/modules/social/service";
import { enforceRateLimit } from "@/infrastructure/rate-limit/service";

import { targetInput, friendResponseInput, friendDeleteInput } from "@/modules/social/validation";

async function requireUser() {
  const authUser = await getCurrentAuthUser();
  return authUser;
}

export async function GET() {
  const authUser = await requireUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const [friends, requests] = await Promise.all([
    listFriends(authUser.id),
    getFriendRequests(authUser.id),
  ]);

  return NextResponse.json({ friends, ...requests });
}

export async function POST(request: Request) {
  const authUser = await requireUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const limited = await enforceRateLimit("social-friends", authUser.id);
  if (limited) return limited;

  const parsed = targetInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const { username } = parsed.data;

  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  try {
    const friendship = await sendFriendRequest(authUser.id, target.id);
    return NextResponse.json({ friendship }, { status: 201 });
  } catch (error) {
    if (error instanceof SocialError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  const authUser = await requireUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = friendResponseInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { friendshipId, action } = parsed.data;
  try {
    const friendship = await respondToFriendRequest(friendshipId, authUser.id, action);
    return NextResponse.json({ friendship });
  } catch (error) {
    if (error instanceof SocialError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  const authUser = await requireUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = friendDeleteInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const username = "username" in parsed.data ? parsed.data.username : null;
  const friendshipId = "friendshipId" in parsed.data ? parsed.data.friendshipId : null;

  try {
    if (friendshipId) {
      await cancelFriendRequest(authUser.id, friendshipId);
      return NextResponse.json({ ok: true });
    }

    if (!username) return NextResponse.json({ error: "Falta username" }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    await removeFriendship(authUser.id, target.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SocialError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
