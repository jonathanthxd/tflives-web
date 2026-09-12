import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { normalizeUsername } from "@/modules/authentication/validation";
import ProfileView from "@/modules/profiles/components/profile-view";
import { publicProfileSelect, toPublicProfile } from "@/modules/profiles/service";
import { identityName } from "@/modules/profiles/types";

interface ProfilePageProps {
  params: Promise<{ locale: string; username: string }>;
}

async function findProfile(rawUsername: string) {
  const username = normalizeUsername(rawUsername);
  if (!/^[a-z][a-z0-9_]{2,19}$/.test(username)) return null;
  const direct = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: publicProfileSelect,
  });
  if (direct) return { profile: direct, alias: false };
  const alias = await prisma.usernameAlias.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { user: { select: publicProfileSelect } },
  });
  return alias ? { profile: alias.user, alias: true } : null;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { locale, username } = await params;
  const result = await findProfile(username);
  if (!result) return { robots: { index: false, follow: false } };
  const publicProfile = toPublicProfile(result.profile);
  const name = identityName(publicProfile);
  const t = await getTranslations({ locale, namespace: "Profile" });
  return {
    title: `${name} (@${publicProfile.username}) | TFLives`,
    description: publicProfile.bio || t("metadataDescription", { username: publicProfile.username ?? name }),
    alternates: { canonical: `/${locale}/perfil/${publicProfile.username}` },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale, username } = await params;
  const result = await findProfile(username);
  if (!result) notFound();
  const { profile } = result;
  const authUser = await getCurrentAuthUser();
  const blocked = authUser && authUser.id !== profile.id
    ? await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: authUser.id, blockedId: profile.id },
            { blockerId: profile.id, blockedId: authUser.id },
          ],
        },
        select: { id: true },
      })
    : null;

  if (!blocked && result.alias && profile.username) redirect(`/${locale}/perfil/${profile.username}`);

  return <ProfileView profile={blocked ? null : toPublicProfile(profile)} isOwner={authUser?.id === profile.id} />;
}
