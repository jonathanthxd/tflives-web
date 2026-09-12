import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { getWalletSummary } from "@/modules/economy/service";

/** The authenticated member can read only their own private wallet. */
export async function GET(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || 20;
  const wallet = await getWalletSummary(authUser.id, limit);
  return NextResponse.json(wallet);
}
