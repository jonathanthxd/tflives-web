import type { Prisma } from "@prisma/client";
import { parseSocialLinks } from "@/modules/profiles/types";

export interface ProfileCompletionInput {
  bio: string | null;
  displayName: string | null;
  image: string | null;
  minecraftUsername: string | null;
  socialLinks: Prisma.JsonValue | null;
}

export function isProfileComplete(user: ProfileCompletionInput) {
  return Boolean(user.bio?.trim()) && Boolean(
    user.minecraftUsername?.trim() || user.image || parseSocialLinks(user.socialLinks).length,
  ) && Boolean(user.displayName?.trim());
}
