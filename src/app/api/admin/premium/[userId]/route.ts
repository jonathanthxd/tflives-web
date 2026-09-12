import { NextResponse } from "next/server";
import { AdminGuardError, requireAdminSection } from "@/modules/administration/api-guard";
import { CosmeticError, getAdminPremiumSummary, grantPremium, revokePremium } from "@/modules/cosmetics/service";

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireAdminSection("cosmetics");
    const { userId } = await params;
    return NextResponse.json(await getAdminPremiumSummary(userId));
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof CosmeticError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "No se pudo obtener Premium" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: actorId } = await requireAdminSection("cosmetics");
    const { userId } = await params;
    const body = await request.json().catch(() => ({}));
    if (body.action === "grant") {
      return NextResponse.json(await grantPremium(actorId, userId, { reason: body.reason, expiresAt: body.expiresAt }), { status: 201 });
    }
    if (body.action === "revoke" && typeof body.entitlementId === "string") {
      return NextResponse.json(await revokePremium(actorId, userId, body.entitlementId, body.reason));
    }
    return NextResponse.json({ error: "Acción Premium inválida" }, { status: 400 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof CosmeticError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "No se pudo actualizar Premium" }, { status: 500 });
  }
}
