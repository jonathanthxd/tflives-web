import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { listComments, createComment, CommentError } from "@/modules/community/comments";
import { enforceRateLimit } from "@/infrastructure/rate-limit/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Falta postId" }, { status: 400 });
  const authUser = await getCurrentAuthUser();

  const comments = await listComments(postId, authUser?.id);
  return NextResponse.json({ comments }, { status: 200 });
}

export async function POST(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const limited = await enforceRateLimit("comments", authUser.id);
  if (limited) return limited;

  try {
    const body = await request.json();
    const postId = typeof body.postId === "string" ? body.postId : "";
    const content = typeof body.content === "string" ? body.content : "";
    const parentId = typeof body.parentId === "string" ? body.parentId : null;

    const comment = await createComment(authUser.id, postId, content, parentId);
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof CommentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al publicar el comentario" }, { status: 500 });
  }
}
