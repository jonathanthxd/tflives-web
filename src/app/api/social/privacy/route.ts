import { NextResponse } from "next/server";
import { FriendsListVisibility } from "@prisma/client";
import { createClient } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";

const VISIBILITY_VALUES: FriendsListVisibility[] = ["PUBLIC", "FRIENDS_ONLY", "PRIVATE"];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { allowFriendRequests: true, friendsListVisibility: true },
  });

  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const data: { allowFriendRequests?: boolean; friendsListVisibility?: FriendsListVisibility } = {};

  if (typeof body.allowFriendRequests === "boolean") {
    data.allowFriendRequests = body.allowFriendRequests;
  }
  if (VISIBILITY_VALUES.includes(body.friendsListVisibility)) {
    data.friendsListVisibility = body.friendsListVisibility;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: authUser.id },
    data,
    select: { allowFriendRequests: true, friendsListVisibility: true },
  });

  return NextResponse.json(updated);
}
