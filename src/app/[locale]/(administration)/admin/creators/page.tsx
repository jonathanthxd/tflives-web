import { getTranslations } from "next-intl/server";
import { Radio } from "lucide-react";
import { requireSectionPage } from "@/modules/administration/page-guard";
import { listCreatorAdminData } from "@/modules/creators/service";
import CreatorAdminManager from "@/modules/creators/components/creator-admin-manager";
import { PageHeader } from "@/modules/administration/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function AdminCreatorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireSectionPage("creators", locale);
  const [t, data] = await Promise.all([getTranslations("Creators"), listCreatorAdminData()]);
  return <div className="min-w-0 space-y-8"><PageHeader icon={Radio} title={t("adminTitle")} description={t("adminDescription")} /><CreatorAdminManager initialApplications={JSON.parse(JSON.stringify(data.applications))} initialCreators={JSON.parse(JSON.stringify(data.creators))} /></div>;
}
