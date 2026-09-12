import { NextResponse } from "next/server";
import { AdminGuardError, requireAdminSection } from "@/modules/administration/api-guard";
import { adjustWalletByAdmin, getAdminWalletSummary, WalletError } from "@/modules/economy/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  try {
    await requireAdminSection("wallet");
    return NextResponse.json(await getAdminWalletSummary(userId));
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof WalletError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener la wallet" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  try {
    const { userId: actorId } = await requireAdminSection("wallet");
    const body = await request.json().catch(() => ({}));
    const direction = body.direction === "DEDUCT" ? "DEDUCT" : body.direction === "GRANT" ? "GRANT" : null;
    if (!direction) return NextResponse.json({ error: "Ajuste inválido" }, { status: 400 });

    const result = await adjustWalletByAdmin({
      actorId,
      targetUserId: userId,
      amount: typeof body.amount === "number" ? body.amount : Number.NaN,
      reason: typeof body.reason === "string" ? body.reason : "",
      direction,
    });
    return NextResponse.json({ balance: result.balance, transaction: result.transaction }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof WalletError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al ajustar la wallet" }, { status: 500 });
  }
}
