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

  const [existing, alias] = await Promise.all([
    prisma.user.findFirst({
      where: { username: { equals: parsed.data, mode: "insensitive" } },
      select: { id: true },
    }),
    prisma.usernameAlias.findFirst({
      where: { username: { equals: parsed.data, mode: "insensitive" } },
      select: { username: true },
    }),
  ]);

  if (existing || alias) {
    return NextResponse.json({ available: false, error: "Este username ya está en uso" });
  }

  return NextResponse.json({ available: true });
}
