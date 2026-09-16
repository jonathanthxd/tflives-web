import { requireSectionPage } from "@/modules/administration/page-guard";
import { listAnnouncements } from "@/modules/administration/announcements";
import AnnouncementsManager from "@/modules/administration/components/announcements-manager";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const instant = false;

export default async function AnnouncementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireSectionPage("announcements", locale);

  const announcements = await listAnnouncements();

  return (
    <div>
      <PageHeader
        icon={SECTION_ICONS.announcements}
        title="Anuncios globales"
        description="Mandá una notificación a toda la comunidad, o solo a una parte."
      />
      <AnnouncementsManager
        initialAnnouncements={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          segment: a.segment,
          createdAt: a.createdAt.toISOString(),
          createdBy: a.createdBy,
        }))}
      />
    </div>
  );
}
