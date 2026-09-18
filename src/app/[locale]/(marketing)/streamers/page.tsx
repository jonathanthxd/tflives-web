import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import CreatorDirectory from "@/modules/creators/components/creator-directory";
import { listFeaturedCreators, listPublicCreators } from "@/modules/creators/service";
import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/config/site";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Creators" });
  return {
    title: `${t("title")} | TFLives`,
    description: t("description"),
    alternates: alternatesFor(locale, "/streamers"),
  };
}

export default async function StreamersPage() {
  const [creators, featured, authUser] = await Promise.all([listPublicCreators(), listFeaturedCreators(), getCurrentAuthUser()]);
  return <CreatorDirectory creators={creators} featured={featured} canApply={Boolean(authUser)} />;
}
