import { requireSectionPage } from "@/modules/administration/page-guard";
import { listAllTeamMembers } from "@/modules/administration/team";
import TeamManager from "@/modules/administration/components/team-manager";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireSectionPage("team", locale);

  const team = await listAllTeamMembers();

  return (
    <div>
      <PageHeader
        icon={SECTION_ICONS.team}
        title="Equipo público"
        description="Quién aparece en la sección de fundadores/equipo del sitio."
      />
      <TeamManager
        initialMembers={team.map((m) => ({
          id: m.id,
          name: m.name,
          roleTitle: m.roleTitle,
          avatarUrl: m.avatarUrl,
          order: m.order,
          active: m.active,
        }))}
      />
    </div>
  );
}
