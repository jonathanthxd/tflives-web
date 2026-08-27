import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/auth/server";
import { toggleReaction, getReactionState, ReactionError, type ReactionTargetType } from "@/modules/community/reactions";

function parseTargetType(value: unknown): ReactionTargetType | null {
  return value === "POST" || value === "COMMENT" ? value : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetType = parseTargetType(searchParams.get("targetType"));
  const targetId = searchParams.get("targetId");
  if (!targetType || !targetId) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const state = await getReactionState(authUser?.id ?? null, targetType, targetId);
  return NextResponse.json(state, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const body = await request.json();
    const targetType = parseTargetType(body.targetType);
    const targetId = typeof body.targetId === "string" ? body.targetId : "";
    if (!targetType) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });

    const result = await toggleReaction(authUser.id, targetType, targetId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ReactionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al reaccionar" }, { status: 500 });
  }
}
