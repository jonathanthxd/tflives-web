import "server-only";
/* eslint-disable @next/next/no-img-element -- ImageResponse uses Satori image nodes; Next Image is not supported in this server image renderer. */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import es from "../../../../messages/es.json";
import en from "../../../../messages/en.json";
import { COSMETIC_PRESETS } from "@/modules/cosmetics/visuals";
import { avatarFrameRecipe } from "@/modules/cosmetics/recipes";
import { loadCardAvatar } from "./avatar";
import { cardUsername, getPublicProfileCard, type PublicProfileCard } from "./public-card";
import { PROFILE_CARD_SIZE } from "./paths";

export const PROFILE_CARD_CACHE_CONTROL = "public, max-age=60, s-maxage=120, stale-while-revalidate=180";
const logo = readFile(join(process.cwd(), "public/icons/icon-192.png")).then((bytes) => `data:image/png;base64,${bytes.toString("base64")}`);
export function profileCardColors(card: PublicProfileCard): readonly [string, string, string] {
  const cosmetic = card.cosmetics.find((item) => item.type === "PROFILE_ACCENT") ?? card.cosmetics.find((item) => item.type === "BANNER_STYLE") ?? card.cosmetics.find((item) => item.type === "AVATAR_FRAME");
  return cosmetic ? COSMETIC_PRESETS[cosmetic.visualPreset].colors : ["#3b82f6", "#6366f1", "#06b6d4"];
}
export function profileCardElement(card: PublicProfileCard, locale: "es" | "en", avatar: string | null, logoData: string) {
  const labels = (locale === "en" ? en : es).ProfileCards;
  const [primary, secondary, tertiary] = profileCardColors(card);
  const frame = avatarFrameRecipe(card.cosmetics.find((item) => item.type === "AVATAR_FRAME")?.visualPreset);
  const formatter = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const name = Array.from(card.name).slice(0, 42).join("");
  const metrics = [
    { label: labels.likes, value: formatter.format(card.likes) },
    { label: labels.achievements, value: formatter.format(card.achievements) },
    { label: labels.followers, value: formatter.format(card.followers) },
    { label: labels.coins, value: labels.private },
  ];
  return <div style={{ display: "flex", width: "100%", height: "100%", padding: "46px 56px", flexDirection: "column", justifyContent: "space-between", background: "#0f1115", color: "#f8fafc", fontFamily: "sans-serif", overflow: "hidden" }}>
    <div style={{ position: "absolute", display: "flex", right: -160, top: -180, width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${primary}44, ${secondary}18 45%, transparent 72%)` }} />
    <div style={{ position: "absolute", display: "flex", left: -150, bottom: -350, width: 800, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${tertiary}22, transparent 72%)` }} />
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}><img src={logoData} width={40} height={40} alt="" /><span style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1 }}>TFLives</span></div>
      <span style={{ fontSize: 14, letterSpacing: 3, color: "#94a3b8" }}>{labels.community}</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 42, marginTop: 14 }}>
      <div style={{ display: "flex", position: "relative", width: 230, height: 230, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="230" height="230" viewBox="0 0 230 230" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="115" cy="115" r="106" fill="none" stroke={frame?.colors[0] ?? primary} strokeWidth="3" opacity="0.35" />
          <circle cx="115" cy="115" r="97" fill="none" stroke={frame?.colors[1] ?? secondary} strokeWidth="5" />
          {frame && Array.from({ length: Math.min(frame.details, 18) }, (_, index) => {
            const angle = index * 360 / frame.details;
            if (frame.motion === "petals") return <ellipse key={index} cx="115" cy="13" rx="5" ry="10" fill={frame.colors[index % 3]} transform={`rotate(${angle} 115 115)`} />;
            if (frame.silhouette === "crystalline") return <path key={index} d="M115 6 L121 17 L115 28 L109 17 Z" fill={frame.colors[index % 3]} transform={`rotate(${angle} 115 115)`} />;
            if (frame.motion === "embers" || frame.motion === "solar") return <path key={index} d="M115 3 Q128 18 115 28 Q105 18 115 3 Z" fill={frame.colors[index % 3]} transform={`rotate(${angle} 115 115)`} />;
            return <circle key={index} cx="115" cy="13" r={frame.silhouette === "ornamented" ? "4" : "2"} fill={frame.colors[index % 3]} transform={`rotate(${angle} 115 115)`} />;
          })}
          {frame?.motion === "royal" && <path d="M91 18 L86 2 L104 11 L115 0 L126 11 L144 2 L139 18 Z" fill={frame.colors[0]} />}
        </svg>
        <div style={{ display: "flex", width: 174, height: 174, alignItems: "center", justifyContent: "center", borderRadius: "50%", overflow: "hidden", background: `linear-gradient(145deg, ${primary}, ${secondary})`, color: "#ffffff", fontSize: 76, fontWeight: 700 }}>
          {avatar ? <img src={avatar} width={174} height={174} style={{ objectFit: "cover" }} alt="" /> : Array.from(card.name.trim())[0]?.toUpperCase() ?? "T"}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 755 }}><span style={{ fontSize: name.length > 28 ? 45 : 58, fontWeight: 700, lineHeight: 1.13, letterSpacing: -1.5 }}>{name}</span><span style={{ marginTop: 18, fontSize: 26, color: "#94a3b8" }}>@{card.username}</span><div style={{ display: "flex", width: 76, height: 4, background: primary, borderRadius: 4, marginTop: 25 }} /></div>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", padding: "22px 26px", borderRadius: 22, border: "1px solid #ffffff18", background: "#ffffff08" }}>
      {metrics.map((metric, index) => <div key={metric.label} style={{ display: "flex", flexDirection: "column", width: "24%", paddingLeft: index === 0 ? 0 : 22, borderLeft: index === 0 ? "none" : "1px solid #ffffff15" }}><span style={{ fontSize: index === 3 ? 29 : 36, fontWeight: 700, color: index === 3 ? "#94a3b8" : "#f8fafc" }}>{metric.value}</span><span style={{ fontSize: 16, marginTop: 8, color: "#94a3b8" }}>{metric.label}</span></div>)}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 14, marginTop: 14 }}><span>www.tflives.com</span><span>{`/perfil/${card.username}`}</span></div>
  </div>;
}
export async function getProfileCardBytes(card: PublicProfileCard, locale: "es" | "en"): Promise<Uint8Array> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 300 });
  const avatar = await loadCardAvatar(card.username, card.image);
  const brand = await logo;
  try {
    return new Uint8Array(await new ImageResponse(profileCardElement(card, locale, avatar, brand), PROFILE_CARD_SIZE).arrayBuffer());
  } catch (error) {
    if (!avatar) throw error;
    return new Uint8Array(await new ImageResponse(profileCardElement(card, locale, null, brand), PROFILE_CARD_SIZE).arrayBuffer());
  }
}
export async function serveProfileCard(username: string, locale: string): Promise<Response> {
  const normalized = cardUsername(username);
  if (!normalized || (locale !== "es" && locale !== "en")) return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } });
  try {
    const card = await getPublicProfileCard(normalized);
    if (!card) return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } });
    const bytes = await getProfileCardBytes(card, locale);
    return new Response(bytes as BodyInit, { headers: { "Content-Type": "image/png", "Cache-Control": PROFILE_CARD_CACHE_CONTROL, "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" } });
  }
}
