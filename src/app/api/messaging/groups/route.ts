import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { MessagingError, createGroup } from "@/modules/messaging/service";

import { z } from "zod";
import { usernameInput } from "@/modules/social/validation";

export async function POST(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = z.object({ name: z.string().trim().max(80).nullable().optional(), usernames: z.array(usernameInput).min(1).max(29) }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Faltan los miembros del grupo" }, { status: 400 });
  }

  const { name, usernames } = parsed.data;
  try {
    const conversation = await createGroup(authUser.id, name || null, usernames);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    if (error instanceof MessagingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
