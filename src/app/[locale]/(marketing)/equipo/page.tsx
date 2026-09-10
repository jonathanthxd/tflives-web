import { getTranslations } from "next-intl/server";
import {
  PublicShell,
  AreaLinks,
  TeamCards,
  StaffLink,
} from "@/modules/network/components/public-content";
import { contentMetadata } from "@/modules/editorial/metadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () =>
  contentMetadata("team", "teamDescription", "/equipo");
export default async function Page() {
  const t = await getTranslations("Content");
  return (
    <PublicShell title={t("team")} description={t("teamDescription")}>
      <AreaLinks />
      <TeamCards />
      <StaffLink section="team" href="/admin/team" />
    </PublicShell>
  );
}
