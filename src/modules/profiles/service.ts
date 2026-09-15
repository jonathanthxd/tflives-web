import { Prisma } from "@prisma/client";
import {
  isSafeProfileMediaUrl,
  parseSocialLinks,
  type PublicIdentity,
  type PublicProfile,
} from "@/modules/profiles/types";
import { getProgressSummary } from "@/modules/progression/level";
import { toSafeCosmeticVisual } from "@/modules/cosmetics/visuals";
import { isEntitlementActive } from "@/modules/cosmetics/service";

export const publicIdentitySelect = {
  id: true,
  username: true,
  displayName: true,
  name: true,
  image: true,
  role: true,
} satisfies Prisma.UserSelect;

export const publicIdentityWithCosmeticsSelect = {
  ...publicIdentitySelect,
  equippedCosmetics: { select: { type: true, cosmetic: { select: { visualPreset: true, premiumOnly: true } } } },
  premiumEntitlements: { select: { startsAt: true, expiresAt: true, revokedAt: true } },
} satisfies Prisma.UserSelect;

export const publicProfileSelect = {
  ...publicIdentitySelect,
  bio: true,
  bannerUrl: true,
  minecraftUsername: true,
  socialLinks: true,
  createdAt: true,
  progress: { select: { xp: true, level: true } },
  wallet: { select: { balance: true } },
  equippedCosmetics: { select: { type: true, cosmetic: { select: { visualPreset: true, premiumOnly: true } } } },
  premiumEntitlements: { select: { startsAt: true, expiresAt: true, revokedAt: true } },
  creatorProfile: { select: { status: true, category: true } },
  _count: { select: { progressionAchievements: true } },
} satisfies Prisma.UserSelect;

type IdentityRecord = Prisma.UserGetPayload<{ select: typeof publicIdentitySelect }>;
type IdentityWithCosmeticsRecord = Prisma.UserGetPayload<{ select: typeof publicIdentityWithCosmeticsSelect }>;
type ProfileRecord = Prisma.UserGetPayload<{ select: typeof publicProfileSelect }>;

/** A deliberately small identity shape for every public/community surface. */
export function toPublicIdentity(user: IdentityRecord): PublicIdentity {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    name: user.name,
    image: isSafeProfileMediaUrl(user.image) ? user.image : null,
    role: user.role,
  };
}

export function toPublicIdentityWithCosmetics(user: IdentityWithCosmeticsRecord) {
  const hasActivePremium = user.premiumEntitlements.some((entitlement) => isEntitlementActive(entitlement));
  return {
    ...toPublicIdentity(user),
    cosmetics: user.equippedCosmetics
      .filter((equipped) => !equipped.cosmetic.premiumOnly || hasActivePremium)
      .map((equipped) => toSafeCosmeticVisual({ type: equipped.type, visualPreset: equipped.cosmetic.visualPreset }))
      .filter((cosmetic): cosmetic is NonNullable<typeof cosmetic> => cosmetic !== null),
  };
}

export function toPublicProfile(user: ProfileRecord): PublicProfile {
  return {
    ...toPublicIdentity(user),
    bio: user.bio,
    bannerUrl: isSafeProfileMediaUrl(user.bannerUrl) ? user.bannerUrl : null,
    minecraftUsername: user.minecraftUsername,
    socialLinks: parseSocialLinks(user.socialLinks),
    createdAt: user.createdAt.toISOString(),
    progress: getProgressSummary(user.progress, user._count.progressionAchievements),
    coinBalance: user.wallet?.balance ?? 0,
    cosmetics: user.equippedCosmetics
      .filter((equipped) => !equipped.cosmetic.premiumOnly || user.premiumEntitlements.some((entitlement) => isEntitlementActive(entitlement)))
      .map((equipped) => toSafeCosmeticVisual({ type: equipped.type, visualPreset: equipped.cosmetic.visualPreset }))
      .filter((cosmetic): cosmetic is NonNullable<typeof cosmetic> => cosmetic !== null),
    creator: user.creatorProfile?.status === "ACTIVE"
      ? { category: user.creatorProfile.category }
      : null,
  };
}
