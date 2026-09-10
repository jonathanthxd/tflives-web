import { getTranslations } from "next-intl/server";
import { prisma } from "@/infrastructure/database/prisma";
import { requireSectionPage } from "@/modules/administration/page-guard";
import ContentManager from "@/modules/administration/components/content-manager";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireSectionPage("posts", locale);
  const t = await getTranslations("Content");
  const items = await prisma.post.findMany({ orderBy: { updatedAt: "desc" } });
  const modalities = await prisma.modality.findMany({
    select: { id: true, name: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="min-w-0 space-y-8">
      <PageHeader
        icon={SECTION_ICONS.posts}
        title={t("posts")}
        description={t("adminEmpty")}
      />
      <ContentManager
        kind="posts"
        initialItems={JSON.parse(JSON.stringify(items))}
        modalities={modalities}
      />
    </div>
  );
}
