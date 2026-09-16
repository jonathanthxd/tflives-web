import { requireSectionPage } from "@/modules/administration/page-guard";
import { listAllAchievements } from "@/modules/achievements/service";
import AchievementManager from "@/modules/achievements/components/achievement-manager";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const instant = false;

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
        description="Creá logros manuales o metas automáticas que los miembros desbloquean con actividad real en TFLives."
      />
      <AchievementManager
        initialAchievements={achievements.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          iconKey: a.iconKey,
          order: a.order,
          active: a.active,
          unlockMode: a.unlockMode,
          trigger: a.trigger,
          triggerValue: a.triggerValue,
          coinReward: a.coinReward,
          _count: a._count,
        }))}
      />
    </div>
  );
}
