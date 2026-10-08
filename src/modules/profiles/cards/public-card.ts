import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import { cacheLife } from "next/cache";
import { prisma } from "@/infrastructure/database/prisma";
import { normalizeUsername } from "@/modules/authentication/validation";
import { toSafeCosmeticVisual, type SafeCosmeticVisual } from "@/modules/cosmetics/visuals";
import { isEntitlementActive } from "@/modules/cosmetics/entitlements";

/** Independent anonymous projection: no email, auth, wallet, messages or admin state. */
export const profileCardSelect = {
  id: true, username: true, displayName: true, name: true, image: true,
  _count: { select: { followers: true, progressionAchievements: true, achievementsEarned: { where: { achievement: { active: true } } } } },
  equippedCosmetics: { select: { type: true, cosmetic: { select: { visualPreset: true, premiumOnly: true } } } },
  premiumEntitlements: { select: { startsAt: true, expiresAt: true, revokedAt: true } },
} satisfies Prisma.UserSelect;
type CardRecord = Prisma.UserGetPayload<{ select: typeof profileCardSelect }>;
export type PublicProfileCard = {
  username: string; name: string; image: string | null;
  likes: number; achievements: number; followers: number; cosmetics: SafeCosmeticVisual[];
};
export function cardUsername(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 64) return null;
  const username = normalizeUsername(value);
  return /^[a-z][a-z0-9_]{2,19}$/.test(username) ? username : null;
}
export function publicCardFromRecord(user: CardRecord, likes: number): PublicProfileCard | null {
  if (!user.username || !cardUsername(user.username)) return null;
  const premium = user.premiumEntitlements.some((item) => isEntitlementActive(item));
  return {
    username: user.username.toLowerCase(),
    name: (user.displayName || user.name || user.username).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 80),
    image: user.image,
    likes,
    achievements: user._count.progressionAchievements + user._count.achievementsEarned,
    followers: user._count.followers,
    cosmetics: user.equippedCosmetics.filter((item) => !item.cosmetic.premiumOnly || premium)
      .map((item) => toSafeCosmeticVisual({ type: item.type, visualPreset: item.cosmetic.visualPreset }))
      .filter((item): item is SafeCosmeticVisual => Boolean(item)),
  };
}
export async function queryPublicProfileCard(username: string, db: Pick<PrismaClient, "user" | "usernameAlias" | "reaction"> = prisma): Promise<PublicProfileCard | null> {
  const normalized = cardUsername(username);
  if (!normalized) return null;
  const direct = await db.user.findFirst({ where: { username: { equals: normalized, mode: "insensitive" } }, select: profileCardSelect });
  const user = direct ?? (await db.usernameAlias.findFirst({ where: { username: { equals: normalized, mode: "insensitive" } }, select: { user: { select: profileCardSelect } } }))?.user;
  if (!user) return null;
  const likes = await db.reaction.count({ where: { targetType: "PROFILE", targetId: user.id } });
  return publicCardFromRecord(user, likes);
}
export async function getPublicProfileCard(username: string): Promise<PublicProfileCard | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 300 });
  return queryPublicProfileCard(username);
}
