import { getTranslations } from "next-intl/server";
import {
  PublicShell,
  AreaLinks,
  TimelineCards,
  StaffLink,
} from "@/modules/network/components/public-content";
import { contentMetadata } from "@/modules/editorial/metadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () =>
  contentMetadata("timeline", "timelineDescription", "/trayectoria");
export default async function Page() {
  const t = await getTranslations("Content");
  return (
    <PublicShell title={t("timeline")} description={t("timelineDescription")}>
      <AreaLinks />
      <TimelineCards />
      <StaffLink section="timeline" href="/admin/timeline" />
    </PublicShell>
  );
}
