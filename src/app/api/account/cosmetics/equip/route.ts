import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { CosmeticError, equipCosmetic, unequipCosmetic } from "@/modules/cosmetics/service";
import { captureApplicationError } from "@/modules/analytics/service";

export async function POST(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  try {
    const body = (await request.json().catch(() => null)) ?? {};
    const cosmeticId = typeof body.cosmeticId === "string" ? body.cosmeticId : "";
    return NextResponse.json(await equipCosmetic(authUser.id, cosmeticId));
  } catch (error) {
    if (error instanceof CosmeticError) return NextResponse.json({ error: error.message }, { status: error.status });
    await captureApplicationError({ area: "cosmetics:equip", error, status: 500 });
    console.error(error);
    return NextResponse.json({ error: "No se pudo equipar el cosmético" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  try {
    const body = (await request.json().catch(() => null)) ?? {};
    return NextResponse.json(await unequipCosmetic(authUser.id, body.type));
  } catch (error) {
    if (error instanceof CosmeticError) return NextResponse.json({ error: error.message }, { status: error.status });
    await captureApplicationError({ area: "cosmetics:unequip", error, status: 500 });
    console.error(error);
    return NextResponse.json({ error: "No se pudo desequipar el cosmético" }, { status: 500 });
  }
}
