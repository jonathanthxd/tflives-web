import { NextResponse } from "next/server";

export async function GET() {
  const serverId = process.env.DISCORD_SERVER_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!serverId || !botToken) {
    return NextResponse.json(
      { presence_count: 0, member_count: null },
      { status: 200 }
    );
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${serverId}?with_counts=true`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) {
      // Fallback al widget si el bot no tiene permisos
      const widgetRes = await fetch(
        `https://discord.com/api/guilds/${serverId}/widget.json`
      );
      const widgetData = await widgetRes.json();
      return NextResponse.json({
        presence_count: widgetData.presence_count || 0,
        member_count: null,
      });
    }

    const data = await res.json();
    return NextResponse.json({
      presence_count: data.approximate_presence_count || 0,
      member_count: data.approximate_member_count || data.member_count || null,
    });
  } catch {
    return NextResponse.json(
      { presence_count: 0, member_count: null },
      { status: 200 }
    );
  }
}