import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { usernameSchema } from "@/modules/authentication/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username") || "";

  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    return NextResponse.json({ available: false, error: parsed.error.issues[0].message });
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ available: false, error: "Este username ya está en uso" });
  }

  return NextResponse.json({ available: true });
}
