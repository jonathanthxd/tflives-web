import { getTranslations } from "next-intl/server";
import { prisma } from "@/infrastructure/database/prisma";
import { requireSectionPage } from "@/modules/administration/page-guard";
import ContentManager from "@/modules/administration/components/content-manager";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";
export const instant = false;
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireSectionPage("wiki", locale);
  const t = await getTranslations("Content");
  const items = await prisma.wikiArticle.findMany({
    orderBy: { updatedAt: "desc" },
  });
  const modalities = await prisma.modality.findMany({
    select: { id: true, name: true },
    orderBy: { order: "asc" },
  });
  const categories = await prisma.wikiCategory.findMany({
    orderBy: { order: "asc" },
  });
  return (
    <div className="min-w-0 space-y-8">
      <PageHeader
        icon={SECTION_ICONS.wiki}
        title={t("wiki")}
        description={t("adminEmpty")}
      />
      <ContentManager
        kind="wiki"
        initialItems={JSON.parse(JSON.stringify(items))}
        modalities={modalities}
        categories={categories}
      />
      <section className="border-t border-border pt-8">
        <h2 className="mb-5 font-display text-xl">{t("categories")}</h2>
        <ContentManager
          kind="categories"
          initialItems={JSON.parse(JSON.stringify(categories))}
        />
      </section>
    </div>
  );
}
