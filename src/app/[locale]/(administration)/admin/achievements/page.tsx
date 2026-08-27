import { requireSectionPage } from "@/modules/administration/page-guard";
import { listAllAchievements } from "@/modules/achievements/service";
import AchievementManager from "@/modules/achievements/components/achievement-manager";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function AchievementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireSectionPage("achievements", locale);

  const achievements = await listAllAchievements();

  return (
    <div>
      <PageHeader
        icon={SECTION_ICONS.achievements}
        title="Logros e insignias"
        description="Catálogo de logros del sitio y quién los tiene. Se otorgan a mano por ahora."
      />
      <AchievementManager
        initialAchievements={achievements.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          iconKey: a.iconKey,
          order: a.order,
          active: a.active,
          _count: a._count,
        }))}
      />
    </div>
  );
}
