import type { PublicProgress } from "@/modules/progression/level";

export const SOCIAL_PLATFORMS = [
  "website",
  "youtube",
  "twitch",
  "github",
  "twitter",
  "tiktok",
  "instagram",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface PublicIdentity {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
  image: string | null;
  role: "USER" | "MOD" | "ADMIN";
}

export interface PublicProfile extends PublicIdentity {
  bio: string | null;
  bannerUrl: string | null;
  minecraftUsername: string | null;
  socialLinks: SocialLink[];
  createdAt: string;
  progress: PublicProgress;
  coinBalance: number;
}

export function identityName(identity: Pick<PublicIdentity, "displayName" | "name" | "username">) {
  return identity.displayName || identity.name || identity.username || "TFLives";
}

export function identityInitial(identity: Pick<PublicIdentity, "displayName" | "name" | "username">) {
  return identityName(identity).trim().charAt(0).toUpperCase() || "T";
}

export function isSafeProfileMediaUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  if (value.startsWith("/api/profile/assets/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

const PLATFORM_HOSTS: Record<Exclude<SocialPlatform, "website">, readonly string[]> = {
  youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"],
  twitch: ["twitch.tv", "www.twitch.tv"],
  github: ["github.com", "www.github.com"],
  twitter: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
  tiktok: ["tiktok.com", "www.tiktok.com"],
  instagram: ["instagram.com", "www.instagram.com"],
};

export function isSafeSocialUrl(platform: SocialPlatform, value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2_048) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (platform === "website") return true;
    const hostname = url.hostname.toLowerCase();
    return PLATFORM_HOSTS[platform].includes(hostname);
  } catch {
    return false;
  }
}

export function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<SocialPlatform>();
  const links: SocialLink[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const { platform, url } = entry as { platform?: unknown; url?: unknown };
    if (!SOCIAL_PLATFORMS.includes(platform as SocialPlatform)) continue;
    const typedPlatform = platform as SocialPlatform;
    if (seen.has(typedPlatform) || !isSafeSocialUrl(typedPlatform, url)) continue;
    seen.add(typedPlatform);
    links.push({ platform: typedPlatform, url: url.trim() });
  }
  return links;
}
