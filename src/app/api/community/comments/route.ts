import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/auth/server";
import { listComments, createComment, CommentError } from "@/modules/community/comments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Falta postId" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const comments = await listComments(postId, authUser?.id);
  return NextResponse.json({ comments }, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

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
