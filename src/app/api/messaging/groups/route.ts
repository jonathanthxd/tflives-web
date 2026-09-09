import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { MessagingError, createGroup } from "@/modules/messaging/service";

export async function POST(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { name, usernames } = await request.json().catch(() => ({}));
  if (!Array.isArray(usernames)) {
    return NextResponse.json({ error: "Faltan los miembros del grupo" }, { status: 400 });
  }

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
