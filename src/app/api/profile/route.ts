import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_FIELDS = ["image", "bio", "bannerUrl", "displayName"] as const;
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

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: authUser.id },
    data,
    select: { id: true, image: true, bio: true, bannerUrl: true, displayName: true },
  });

  return NextResponse.json({ user: updated }, { status: 200 });
}
