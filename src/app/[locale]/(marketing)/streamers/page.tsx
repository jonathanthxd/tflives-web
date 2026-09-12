import type { Metadata } from "next";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import CreatorDirectory from "@/modules/creators/components/creator-directory";
import { listFeaturedCreators, listPublicCreators } from "@/modules/creators/service";

export const metadata: Metadata = {
  title: "Streamers & creators | TFLives",
  description: "Discover active TFLives creators and their official channels.",
};

export default async function StreamersPage() {
  const [creators, featured, authUser] = await Promise.all([listPublicCreators(), listFeaturedCreators(), getCurrentAuthUser()]);
  return <CreatorDirectory creators={creators} featured={featured} canApply={Boolean(authUser)} />;
}
