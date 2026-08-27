import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { logAdminAction } from "@/modules/administration/action-log";

export async function GET() {
  try {
    const modalities = await prisma.modality.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ modalities }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("modalities");
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const modality = await prisma.modality.create({
      data: {
        name,
        description: typeof body.description === "string" ? body.description.trim() || null : null,
        icon: typeof body.icon === "string" ? body.icon.trim() || null : null,
      },
    });

    await logAdminAction({
      actorId: userId,
      action: "modality.create",
      targetType: "Modality",
      targetId: modality.id,
      metadata: { name },
    });

    return NextResponse.json({ modality }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Ya existe una modalidad con ese nombre" }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al crear la modalidad" }, { status: 500 });
  }
}