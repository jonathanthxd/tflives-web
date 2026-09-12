import { NextResponse } from "next/server";
import { AdminGuardError, requireAdminSection } from "@/modules/administration/api-guard";
import { CosmeticError, searchPremiumUsers } from "@/modules/cosmetics/service";

export async function GET(request: Request) {
  try {
    await requireAdminSection("cosmetics");
    const query = new URL(request.url).searchParams.get("query") ?? "";
    return NextResponse.json({ users: await searchPremiumUsers(query) });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof CosmeticError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "No se pudieron buscar usuarios" }, { status: 500 });
  }
}
