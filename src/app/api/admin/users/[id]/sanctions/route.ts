import { NextResponse } from "next/server";
import { SanctionType } from "@prisma/client";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { applySanction, listUserSanctions, SanctionError } from "@/modules/administration/sanctions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAdminSection("moderation");
    const sanctions = await listUserSanctions(id);
    return NextResponse.json({ sanctions }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener las sanciones" }, { status: 500 });
  }
}

const VALID_TYPES: SanctionType[] = ["BAN", "SUSPEND", "MUTE", "WARNING"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await requireAdminSection("moderation");
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "invalid" }, { status: 400 });

    const type = body.type as SanctionType;
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Tipo de sanción inválido" }, { status: 400 });
    }
    const reason = typeof body.reason === "string" ? body.reason : "";
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const sanction = await applySanction(userId, id, type, reason, expiresAt);
    return NextResponse.json({ sanction }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof SanctionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al aplicar la sanción" }, { status: 500 });
  }
}
