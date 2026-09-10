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
  await requireSectionPage("timeline", locale);
  const t = await getTranslations("Content");
  const items = await prisma.timelineMilestone.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="min-w-0 space-y-8">
      <PageHeader
        icon={SECTION_ICONS.timeline}
        title={t("timeline")}
        description={t("adminEmpty")}
      />
      <ContentManager
        kind="timeline"
        initialItems={JSON.parse(JSON.stringify(items))}
      />
    </div>
  );
}
