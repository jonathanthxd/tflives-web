import { getTranslations } from "next-intl/server";
import { requireSectionPage } from "@/modules/administration/page-guard";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";
import AdminCosmeticsManager from "@/modules/cosmetics/components/admin-cosmetics-manager";
import { listAllCosmetics } from "@/modules/cosmetics/service";

export const dynamic = "force-dynamic";

export default async function CosmeticsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireSectionPage("cosmetics", locale);
  const t = await getTranslations({ locale, namespace: "AdminCosmetics" });
  const cosmetics = await listAllCosmetics();
  return <div><PageHeader icon={SECTION_ICONS.cosmetics} title={t("title")} description={t("subtitle")} /><AdminCosmeticsManager initialCosmetics={cosmetics} /></div>;
}
