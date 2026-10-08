import "server-only";
import { ProfileAssetKind } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { validateProfileImage } from "@/modules/profiles/media";

export const MAX_CARD_AVATAR_BYTES = 512 * 1024;
const AVATAR_HOSTS = new Set(["avatars.githubusercontent.com", "cdn.discordapp.com", "media.discordapp.net", "lh3.googleusercontent.com"]);
export function trustedAvatarUrl(value: unknown): URL | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || !AVATAR_HOSTS.has(url.hostname)) return null;
    return url;
  } catch { return null; }
}
export function avatarData(bytes: Uint8Array, mimeType: string): string | null {
  if (!bytes.length || bytes.length > MAX_CARD_AVATAR_BYTES) return null;
  try {
    validateProfileImage(bytes, mimeType, ProfileAssetKind.AVATAR);
    return `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch { return null; }
}
export async function loadCardAvatar(username: string, image: string | null): Promise<string | null> {
  if (!image) return null;
  try {
    if (image.startsWith("/api/profile/assets/")) {
      const match = /^\/api\/profile\/assets\/([^/?]+)\/avatar(?:\?[^#]*)?$/.exec(image);
      if (!match) return null;
      const asset = await prisma.profileAsset.findFirst({ where: { userId: decodeURIComponent(match[1]), kind: "AVATAR", user: { username: { equals: username, mode: "insensitive" } } }, select: { bytes: true, mimeType: true } });
      return asset ? avatarData(asset.bytes, asset.mimeType) : null;
    }
    const url = trustedAvatarUrl(image);
    if (!url) return null;
    const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(1500), cache: "no-store", headers: { accept: "image/png,image/jpeg,image/webp" } });
    if (!response.ok || !response.body) return null;
    const contentLength = Number(response.headers.get("content-length"));
    if (contentLength > MAX_CARD_AVATAR_BYTES) { await response.body.cancel(); return null; }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        total += chunk.value.byteLength;
        if (total > MAX_CARD_AVATAR_BYTES) { await reader.cancel(); return null; }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    return avatarData(Buffer.concat(chunks), response.headers.get("content-type")?.split(";")[0] ?? "");
  } catch { return null; }
}
