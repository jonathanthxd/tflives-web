import { NextResponse } from "next/server";
import { AdminGuardError, requireAdminSection } from "@/modules/administration/api-guard";
import { CosmeticError, deleteCosmetic, updateCosmetic } from "@/modules/cosmetics/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAdminSection("cosmetics");
    const { id } = await params;
    const cosmetic = await updateCosmetic(userId, id, await request.json().catch(() => ({})));
    return NextResponse.json({ cosmetic });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof CosmeticError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "No se pudo actualizar el cosmético" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAdminSection("cosmetics");
    const { id } = await params;
    await deleteCosmetic(userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof CosmeticError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "No se pudo borrar el cosmético" }, { status: 500 });
  }
}
