import { getTranslations } from "next-intl/server";
import { requireSectionPage } from "@/modules/administration/page-guard";
import ModerationManager from "@/modules/administration/components/moderation-manager";
import AppealsQueue from "@/modules/administration/components/appeals-queue";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const instant = false;

export default async function ModerationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireSectionPage("moderation", locale);
  const t = await getTranslations({ locale, namespace: "AdminPlatform" });

  return (
    <div>
      <PageHeader
        icon={SECTION_ICONS.moderation}
        title={t("moderationTitle")}
        description={t("moderationDescription")}
      />
      <AppealsQueue />
      <ModerationManager />
    </div>
  );
}
