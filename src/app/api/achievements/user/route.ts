import { NextResponse } from "next/server";
import { listUserAchievements, AchievementError } from "@/modules/achievements/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  if (!username) return NextResponse.json({ error: "Falta username" }, { status: 400 });

  try {
    const achievements = await listUserAchievements(username);
    return NextResponse.json({ achievements }, { status: 200 });
  } catch (error) {
    if (error instanceof AchievementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener los logros" }, { status: 500 });
  }
}
