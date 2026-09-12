import { Prisma } from "@prisma/client";
import {
  isSafeProfileMediaUrl,
  parseSocialLinks,
  type PublicIdentity,
  type PublicProfile,
} from "@/modules/profiles/types";
import { getProgressSummary } from "@/modules/progression/level";

export const publicIdentitySelect = {
  id: true,
  username: true,
  displayName: true,
  name: true,
  image: true,
  role: true,
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
  _count: { select: { progressionAchievements: true } },
} satisfies Prisma.UserSelect;

type IdentityRecord = Prisma.UserGetPayload<{ select: typeof publicIdentitySelect }>;
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
  };
}
