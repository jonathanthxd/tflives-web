import { NextResponse } from "next/server";
import { AdminGuardError, requireAdminSection } from "@/modules/administration/api-guard";
import { CosmeticError, createCosmetic, listAllCosmetics } from "@/modules/cosmetics/service";

export async function GET() {
  try {
    await requireAdminSection("cosmetics");
    return NextResponse.json({ cosmetics: await listAllCosmetics() });
  } catch (error) {
    if (error instanceof AdminGuardError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "No se pudieron obtener los cosméticos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("cosmetics");
    const cosmetic = await createCosmetic(userId, await request.json().catch(() => ({})));
    return NextResponse.json({ cosmetic }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof CosmeticError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "No se pudo crear el cosmético" }, { status: 500 });
  }
}
