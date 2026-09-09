import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { deleteComment, CommentError } from "@/modules/community/comments";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const profile = await prisma.user.findUnique({ where: { id: authUser.id }, select: { role: true } });
    if (!profile) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    await deleteComment(authUser.id, profile.role, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof CommentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al borrar el comentario" }, { status: 500 });
  }
}
