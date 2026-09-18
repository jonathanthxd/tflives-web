import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import {
  toggleReaction,
  getReactionState,
  ReactionError,
  type ReactionTargetType,
} from "@/modules/community/reactions";
import { enforceRateLimit } from "@/infrastructure/rate-limit/service";

function parseTargetType(value: unknown): ReactionTargetType | null {
  return value === "POST" || value === "COMMENT" ? value : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetType = parseTargetType(searchParams.get("targetType"));
  const targetId = searchParams.get("targetId");
  if (!targetType || !targetId) {
    return NextResponse.json(
      { error: "Parámetros inválidos" },
      { status: 400 },
    );
  }
  const authUser = await getCurrentAuthUser();

  try {
    const state = await getReactionState(
      authUser?.id ?? null,
      targetType,
      targetId,
    );
    return NextResponse.json(state, { status: 200 });
  } catch (error) {
    if (error instanceof ReactionError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const limited = await enforceRateLimit("reactions", authUser.id);
  if (limited) return limited;

  try {
    const body = await request.json();
    const targetType = parseTargetType(body.targetType);
    const targetId = typeof body.targetId === "string" ? body.targetId : "";
    if (!targetType)
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });

    const result = await toggleReaction(authUser.id, targetType, targetId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ReactionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Error al reaccionar" }, { status: 500 });
  }
}
