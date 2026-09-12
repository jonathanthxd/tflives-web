import { NextResponse } from "next/server";
import { AdminGuardError, requireAdminSection } from "@/modules/administration/api-guard";
import { searchWalletUsers } from "@/modules/economy/service";

export async function GET(request: Request) {
  try {
    await requireAdminSection("wallet");
    const query = new URL(request.url).searchParams.get("query") ?? "";
    const users = await searchWalletUsers(query);
    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al buscar wallets" }, { status: 500 });
  }
}
