import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { normalizeUsername } from "@/modules/authentication/validation";
import { publicIdentitySelect, toPublicIdentity } from "@/modules/profiles/service";
import { getBlockStatus } from "@/modules/social/service";

import { targetInput } from "@/modules/social/validation";
import { getActiveBanOrSuspension } from "@/modules/administration/sanctions";
import { serializableTransaction, lockUserPair } from "@/infrastructure/database/transaction";

async function resolveTarget(username: string | null) {
  if (!username) return null;
  return prisma.user.findFirst({
    where: { username: { equals: normalizeUsername(username), mode: "insensitive" } },
    select: { id: true },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = await resolveTarget(searchParams.get("username"));
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const authUser = await getCurrentAuthUser();
  const [count, ownLike, likers] = await Promise.all([
    prisma.reaction.count({ where: { targetType: "PROFILE", targetId: target.id } }),
    authUser
      ? prisma.reaction.findUnique({
          where: {
            userId_targetType_targetId: {
              userId: authUser.id,
              targetType: "PROFILE",
              targetId: target.id,
            },
          },
          select: { id: true },
        })
      : null,
    authUser?.id === target.id
      ? prisma.reaction.findMany({
          where: { targetType: "PROFILE", targetId: target.id },
          orderBy: { createdAt: "desc" },
          select: { user: { select: publicIdentitySelect } },
          take: 100,
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    count,
    liked: Boolean(ownLike),
    canLike: Boolean(authUser && authUser.id !== target.id),
    likers: authUser?.id === target.id ? likers.map((row) => toPublicIdentity(row.user)) : [],
  });
}

export async function POST(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = targetInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  if (await getActiveBanOrSuspension(authUser.id)) return NextResponse.json({ error: "Acción no disponible" }, { status: 403 });
  const target = await resolveTarget(parsed.data.username);
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (target.id === authUser.id) {
    return NextResponse.json({ error: "No podés indicar que te gusta tu propio perfil" }, { status: 400 });
  }

  const blocks = await getBlockStatus(authUser.id, target.id);
  if (blocks.blockedByViewer || blocks.blockedByTarget) {
    return NextResponse.json({ error: "Esta interacción no está disponible" }, { status: 403 });
  }

  const key = {
    userId_targetType_targetId: {
      userId: authUser.id,
      targetType: "PROFILE",
      targetId: target.id,
    },
  } as const;
  return serializableTransaction(async (tx) => {
  await lockUserPair(tx, authUser.id, target.id);
  const existing = await tx.reaction.findUnique({ where: key, select: { id: true } });

  if (existing) {
    await tx.reaction.delete({ where: { id: existing.id } });
  } else {
    await tx.reaction.create({
      data: { userId: authUser.id, targetType: "PROFILE", targetId: target.id },
    });
  }

  const count = await tx.reaction.count({ where: { targetType: "PROFILE", targetId: target.id } });
  return NextResponse.json({ liked: !existing, count });
  });
}
