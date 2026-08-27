import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { getActiveBanOrSuspension } from "@/modules/administration/sanctions";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const [profile, activeSanction] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        username: true,
        image: true,
        role: true,
        bio: true,
        bannerUrl: true,
        minecraftUsername: true,
        socialLinks: true,
      },
    }),
    getActiveBanOrSuspension(authUser.id),
  ]);

  return NextResponse.json(
    {
      user: profile,
      banned: activeSanction
        ? { type: activeSanction.type, reason: activeSanction.reason, expiresAt: activeSanction.expiresAt }
        : null,
    },
    { status: 200 }
  );
}
