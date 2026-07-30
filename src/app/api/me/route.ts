import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const profile = await prisma.user.findUnique({
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
    },
  });

  return NextResponse.json({ user: profile }, { status: 200 });
}
