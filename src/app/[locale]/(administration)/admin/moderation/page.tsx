import { requireSectionPage } from "@/modules/administration/page-guard";
import ModerationManager from "@/modules/administration/components/moderation-manager";
import AppealsQueue from "@/modules/administration/components/appeals-queue";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function ModerationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireSectionPage("moderation", locale);

  return (
    <div>
      <PageHeader
        icon={SECTION_ICONS.moderation}
        title="Sanciones"
        description="Banear, suspender, silenciar o advertir a un usuario. Buscá su cuenta para ver el historial y aplicar una sanción."
      />
      <AppealsQueue />
      <ModerationManager />
    </div>
  );
}
