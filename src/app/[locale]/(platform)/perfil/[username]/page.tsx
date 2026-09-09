import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/database/prisma";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import ProfileView from "@/modules/profiles/components/profile-view";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  const profile = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      name: true,
      email: true,
      image: true,
      bannerUrl: true,
      bio: true,
      minecraftUsername: true,
      socialLinks: true,
      role: true,
      createdAt: true,
    },
  });

  if (!profile) {
    notFound();
  }
  const authUser = await getCurrentAuthUser();

  const isOwner = authUser?.id === profile.id;

  return <ProfileView profile={profile} isOwner={isOwner} />;
}
