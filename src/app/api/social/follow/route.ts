import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { SocialError, follow, unfollow } from "@/modules/social/service";
import { enforceRateLimit } from "@/infrastructure/rate-limit/service";

import { targetInput } from "@/modules/social/validation";

async function resolveTarget(request: Request) {
  const parsed = targetInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return { invalid: true } as const;
  const { username } = parsed.data;
  return prisma.user.findUnique({ where: { username }, select: { id: true } });
}

export async function POST(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const limited = await enforceRateLimit("social-follow", authUser.id);
  if (limited) return limited;

  const target = await resolveTarget(request.clone());
  if (target && "invalid" in target) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  try {
    await follow(authUser.id, target.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SocialError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const target = await resolveTarget(request.clone());
  if (target && "invalid" in target) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await unfollow(authUser.id, target.id);
  return NextResponse.json({ ok: true });
}
