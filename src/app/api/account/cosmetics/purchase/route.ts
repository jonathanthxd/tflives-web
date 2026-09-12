import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { CosmeticError, purchaseCosmetic } from "@/modules/cosmetics/service";

export async function POST(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    const cosmeticId = typeof body.cosmeticId === "string" ? body.cosmeticId : "";
    // Price is deliberately absent from the input: the server reads the current catalogue row.
    const purchase = await purchaseCosmetic(authUser.id, cosmeticId);
    return NextResponse.json(purchase, { status: 200 });
  } catch (error) {
    if (error instanceof CosmeticError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "No se pudo comprar el cosmético" }, { status: 500 });
  }
}
