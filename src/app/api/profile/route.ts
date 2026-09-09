import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { usernameSchema } from "@/modules/authentication/validation";

const ALLOWED_FIELDS = [
  "image",
  "bio",
  "bannerUrl",
  "displayName",
  "username",
  "minecraftUsername",
] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

const FIELD_SCHEMAS: Partial<Record<AllowedField, z.ZodType<string>>> = {
  bio: z.string().max(280, "La bio no puede superar los 280 caracteres"),
  displayName: z.string().max(60, "El nombre no puede superar los 60 caracteres"),
  image: z.string().refine(
    (value) => value.startsWith("/api/profile/assets/") || z.string().url().safeParse(value).success,
    "URL de imagen inválida"
  ),
  bannerUrl: z.string().refine(
    (value) => value.startsWith("/api/profile/assets/") || z.string().url().safeParse(value).success,
    "URL de banner inválida"
  ),
  minecraftUsername: z
    .string()
    .regex(/^[A-Za-z0-9_]{3,16}$/, "Username de Minecraft inválido (3-16 caracteres, sin espacios)"),
};

const SOCIAL_LINK_SCHEMA = z
  .array(
    z.object({
      platform: z.string().min(1).max(30),
      url: z.string().url("URL inválida"),
    })
  )
  .max(6, "Máximo 6 enlaces sociales");

export async function PATCH(request: Request) {
  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const data: Partial<Record<AllowedField, string>> & { socialLinks?: Prisma.InputJsonValue } = {};

  for (const field of ALLOWED_FIELDS) {
    if (typeof body[field] === "string") {
      const schema = FIELD_SCHEMAS[field];
      if (schema) {
        const parsed = schema.safeParse(body[field]);
        if (!parsed.success) {
          return NextResponse.json(
            { error: parsed.error.issues[0].message },
            { status: 400 }
          );
        }
      }
      data[field] = body[field];
    }
  }

  if (body.socialLinks !== undefined) {
    const parsed = SOCIAL_LINK_SCHEMA.safeParse(body.socialLinks);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    data.socialLinks = parsed.data;
  }

  if (data.username !== undefined) {
    const parsed = usernameSchema.safeParse(data.username);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    data.username = parsed.data;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data,
      select: {
        id: true,
        image: true,
        bio: true,
        bannerUrl: true,
        displayName: true,
        username: true,
        minecraftUsername: true,
        socialLinks: true,
      },
    });

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Este username ya está en uso" },
        { status: 409 }
      );
    }
    throw error;
  }
}
