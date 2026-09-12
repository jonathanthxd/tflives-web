import { NextResponse } from "next/server";
import { listPublicCosmetics } from "@/modules/cosmetics/service";

/** Active catalogue only. Inventory and purchase state stay private. */
export async function GET() {
  const cosmetics = await listPublicCosmetics();
  return NextResponse.json({ cosmetics });
}
