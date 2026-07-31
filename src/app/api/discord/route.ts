import { NextResponse } from "next/server";
import { getDiscordGuildCounts } from "@/infrastructure/external-services/discord";

export async function GET() {
  const counts = await getDiscordGuildCounts();
  return NextResponse.json(counts, { status: 200 });
}
