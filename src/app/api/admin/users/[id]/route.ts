import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { logAdminAction } from "@/modules/administration/action-log";
import { getActiveSanctions } from "@/modules/administration/sanctions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAdminSection("users");

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const activeSanctions = await getActiveSanctions(id);
    return NextResponse.json({ user, activeSanctions }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener el usuario" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await requireAdminSection("users");
    const body = await request.json();
    const role = body.role as Role | undefined;
    if (!role || !(["USER", "MOD", "ADMIN"] as const).includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }
    if (id === userId) {
      return NextResponse.json({ error: "No podés cambiar tu propio rol" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!existing) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, role: true },
    });

    await logAdminAction({
      actorId: userId,
      action: "user.role_change",
      targetType: "User",
      targetId: id,
      metadata: { from: existing.role, to: role },
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar el usuario" }, { status: 500 });
  }
}
