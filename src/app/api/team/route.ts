import { NextResponse } from "next/server";
import { listPublicTeam } from "@/modules/administration/team";

export async function GET() {
  const team = await listPublicTeam();
  return NextResponse.json({ team }, { status: 200 });
}
