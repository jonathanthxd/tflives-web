import { getTranslations } from "next-intl/server";
import { requireSectionPage } from "@/modules/administration/page-guard";
import { listStickersForAdmin } from "@/modules/chat/service";
import ChatStickersManager from "@/modules/administration/components/chat-stickers-manager";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function AdminChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireSectionPage("chat", locale);
  const t = await getTranslations({ locale, namespace: "AdminChat" });
  const stickers = await listStickersForAdmin();

  return (
    <div className="min-w-0 space-y-8">
      <PageHeader
        icon={SECTION_ICONS.chat}
        title={t("title")}
        description={t("subtitle")}
      />
      <ChatStickersManager initialStickers={stickers} />
    </div>
  );
}
