import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { listCosmeticsForAccount } from "@/modules/cosmetics/service";

/** The authenticated member can read only their own cosmetics and inventory. */
export async function GET() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  return NextResponse.json(await listCosmeticsForAccount(authUser.id));
}
