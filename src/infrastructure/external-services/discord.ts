import { z } from "zod";
export const DISCORD_INVITE = "https://discord.com/invite/c3jFPyJ9vd";
export interface DiscordGuildCounts {
  presence_count: number | null;
  member_count: number | null;
}
const count = z.number().int().nonnegative().optional();
const guildPayload = z.object({
  approximate_presence_count: count,
  approximate_member_count: count,
});
const widgetPayload = z.object({ presence_count: count });
export async function getDiscordGuildCounts(): Promise<DiscordGuildCounts> {
  const guild = process.env.DISCORD_SERVER_ID || "1246905708541120593";
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!/^\d+$/.test(guild)) return { presence_count: null, member_count: null };
  if (token) {
    try {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guild}?with_counts=true`,
        {
          headers: { Authorization: `Bot ${token}` },
          signal: AbortSignal.timeout(2500),
          next: { revalidate: 300 },
        },
      );
      if (response.ok) {
        const data = guildPayload.parse(await response.json());
        return {
          presence_count: data.approximate_presence_count ?? null,
          member_count: data.approximate_member_count ?? null,
        };
      }
    } catch {
      /* Public widget remains available without bot credentials. */
    }
  }
  try {
    const response = await fetch(
      `https://discord.com/api/guilds/${guild}/widget.json`,
      { signal: AbortSignal.timeout(2500), next: { revalidate: 300 } },
    );
    if (response.ok) {
      const data = widgetPayload.parse(await response.json());
      return {
        presence_count: data.presence_count ?? null,
        member_count: null,
      };
    }
  } catch {
    /* Missing integration is represented as unknown, never zero. */
  }
  return { presence_count: null, member_count: null };
}
