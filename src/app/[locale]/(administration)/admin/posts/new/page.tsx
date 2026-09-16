import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/database/prisma";
import { requireSectionPage } from "@/modules/administration/page-guard";
import ContentManager from "@/modules/administration/components/content-manager";
export const instant = false;
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  await requireSectionPage("posts", locale);
  const t = await getTranslations("Content");
  void notFound;
  const modalities = await prisma.modality.findMany({
    select: { id: true, name: true },
  });
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">{t("posts")}</h1>
      <ContentManager
        kind="posts"
        initialItems={[]}
        modalities={modalities}
        createInitially
      />
    </div>
  );
}
