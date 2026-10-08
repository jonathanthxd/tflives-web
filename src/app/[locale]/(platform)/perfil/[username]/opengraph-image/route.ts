import { enforceRateLimit } from "@/infrastructure/rate-limit/service";
import { cardUsername } from "@/modules/profiles/cards/public-card";
import { serveProfileCard } from "@/modules/profiles/cards/image";

/** Explicit image route keeps alias metadata canonical and also works as an embed URL. */
export async function GET(request: Request, { params }: { params: Promise<{ locale: string; username: string }> }) {
  const { locale, username } = await params;
  if (!cardUsername(username) || (locale !== "es" && locale !== "en")) return new Response(null, { status: 404 });
  const ip = (request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "anonymous").split(",")[0].trim().slice(0, 64);
  const limited = await enforceRateLimit("profile-card", ip);
  if (limited) { limited.headers.set("Cache-Control", "no-store"); return limited; }
  return serveProfileCard(username, locale);
}
