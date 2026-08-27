import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { logAdminAction } from "@/modules/administration/action-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await requireAdminSection("modalities");
    const body = await request.json();

    const data: { name?: string; description?: string | null; icon?: string | null } = {};
    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
      data.name = name;
    }
    if (typeof body.description === "string") data.description = body.description.trim() || null;
    if (typeof body.icon === "string") data.icon = body.icon.trim() || null;

    const modality = await prisma.modality.update({ where: { id }, data });

    await logAdminAction({
      actorId: userId,
      action: "modality.update",
      targetType: "Modality",
      targetId: id,
      metadata: data,
    });

    return NextResponse.json({ modality }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Ya existe una modalidad con ese nombre" }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar la modalidad" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await requireAdminSection("modalities");

    const postCount = await prisma.post.count({ where: { modalityId: id } });
    if (postCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar: hay posts usando esta modalidad" },
        { status: 409 }
      );
    }

    await prisma.modality.delete({ where: { id } });

    await logAdminAction({
      actorId: userId,
      action: "modality.delete",
      targetType: "Modality",
      targetId: id,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar la modalidad" }, { status: 500 });
  }
}
