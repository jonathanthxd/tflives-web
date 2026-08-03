import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/auth/server";
import { searchUsers } from "@/modules/social/service";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const results = await searchUsers(q, authUser.id);
  return NextResponse.json({ results });
}
