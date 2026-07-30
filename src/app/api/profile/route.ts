import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { usernameSchema } from "@/lib/validations/auth";

const ALLOWED_FIELDS = ["image", "bio", "bannerUrl", "displayName", "username"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const data: Partial<Record<AllowedField, string>> = {};

  for (const field of ALLOWED_FIELDS) {
    if (typeof body[field] === "string") {
      data[field] = body[field];
    }
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
