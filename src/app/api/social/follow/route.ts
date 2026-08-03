import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { SocialError, follow, unfollow } from "@/modules/social/service";

async function resolveTarget(request: Request) {
  const { username } = await request.json().catch(() => ({}));
  if (!username) return null;
  return prisma.user.findUnique({ where: { username }, select: { id: true } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const target = await resolveTarget(request.clone());
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
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const target = await resolveTarget(request.clone());
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await unfollow(authUser.id, target.id);
  return NextResponse.json({ ok: true });
}
