import { getTranslations } from "next-intl/server";
import { requireSectionPage } from "@/modules/administration/page-guard";
import WalletManager from "@/modules/economy/components/wallet-manager";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const instant = false;

export default async function WalletAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireSectionPage("wallet", locale);
  const t = await getTranslations({ locale, namespace: "WalletAdmin" });

  return (
    <div>
      <PageHeader icon={SECTION_ICONS.wallet} title={t("title")} description={t("subtitle")} />
      <WalletManager />
    </div>
  );
}
