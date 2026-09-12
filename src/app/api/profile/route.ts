import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { usernameSchema } from "@/modules/authentication/validation";
import { publicProfileSelect, toPublicProfile } from "@/modules/profiles/service";
import { profileUpdateSchema } from "@/modules/profiles/validation";
import { awardProfileCompletion, isProfileComplete } from "@/modules/progression/service";

const USERNAME_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

export async function PATCH(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Perfil inválido" },
      { status: 400 },
    );
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const current = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      username: true,
      usernameChangedAt: true,
      bio: true,
      displayName: true,
      image: true,
      minecraftUsername: true,
      socialLinks: true,
    },
  });
  if (!current) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }
  const wasProfileComplete = isProfileComplete(current);

  const data: Prisma.UserUpdateInput = {};
  let nextUsername: string | null = null;
  if (parsed.data.displayName !== undefined) data.displayName = parsed.data.displayName;
  if (parsed.data.bio !== undefined) data.bio = parsed.data.bio;
  if (parsed.data.minecraftUsername !== undefined) data.minecraftUsername = parsed.data.minecraftUsername;
  if (parsed.data.socialLinks !== undefined) {
    data.socialLinks = parsed.data.socialLinks as unknown as Prisma.InputJsonValue;
  }

  if (parsed.data.username !== undefined) {
    const username = usernameSchema.safeParse(parsed.data.username);
    if (!username.success) {
      return NextResponse.json({ error: username.error.issues[0]?.message }, { status: 400 });
    }

    if (username.data !== current.username) {
      const now = new Date();
      if (current.username && current.usernameChangedAt && now.getTime() - current.usernameChangedAt.getTime() < USERNAME_COOLDOWN_MS) {
        return NextResponse.json(
          { error: "Podés cambiar tu username una vez cada 30 días" },
          { status: 429 },
        );
      }
      const [userConflict, aliasConflict] = await Promise.all([
        prisma.user.findFirst({
          where: {
            id: { not: authUser.id },
            username: { equals: username.data, mode: "insensitive" },
          },
          select: { id: true },
        }),
        prisma.usernameAlias.findFirst({
          where: { username: { equals: username.data, mode: "insensitive" } },
          select: { userId: true },
        }),
      ]);
      if (userConflict || (aliasConflict && aliasConflict.userId !== authUser.id)) {
        return NextResponse.json({ error: "Este username ya está en uso" }, { status: 409 });
      }
      data.username = username.data;
      if (current.username) data.usernameChangedAt = now;
      nextUsername = username.data;
    }
  }

  if (Object.keys(data).length === 0) {
    const profile = await prisma.user.findUnique({ where: { id: authUser.id }, select: publicProfileSelect });
    return NextResponse.json({ user: profile ? toPublicProfile(profile) : null });
  }

  try {
    if (nextUsername && current.username) {
      const previousUsername = current.username;
      const updated = await prisma.$transaction(async (tx) => {
        await tx.usernameAlias.deleteMany({ where: { username: nextUsername, userId: authUser.id } });
        await tx.usernameAlias.upsert({
          where: { username: previousUsername },
          create: { username: previousUsername, userId: authUser.id },
          update: { userId: authUser.id },
        });
        return tx.user.update({ where: { id: authUser.id }, data, select: publicProfileSelect });
      });
      if (!wasProfileComplete) await awardProfileCompletion(authUser.id);
      return NextResponse.json({ user: toPublicProfile(updated) });
    }

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data,
      select: publicProfileSelect,
    });
    if (!wasProfileComplete) await awardProfileCompletion(authUser.id);
    return NextResponse.json({ user: toPublicProfile(updated) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Este username ya está en uso" }, { status: 409 });
    }
    throw error;
  }
}
