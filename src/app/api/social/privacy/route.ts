import { NextResponse } from "next/server";
import { privacyInput } from "@/modules/social/validation";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";



export async function GET() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { allowFriendRequests: true, friendsListVisibility: true },
  });

  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = privacyInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const data = parsed.data;

  const updated = await prisma.user.update({
    where: { id: authUser.id },
    data,
    select: { allowFriendRequests: true, friendsListVisibility: true },
  });

  return NextResponse.json(updated);
}
