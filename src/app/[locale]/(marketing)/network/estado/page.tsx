import { getTranslations } from "next-intl/server";
import {
  PublicShell,
  AreaLinks,
  Empty,
  ModalityCards,
  PostsFeed,
} from "@/modules/network/components/public-content";
import { contentMetadata } from "@/modules/editorial/metadata";
import { Suspense } from "react";
import { NetworkStatusPanel } from "@/modules/network/components/status-panel";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const generateMetadata = () =>
  contentMetadata("statusPage", "statusDescription", "/network/estado");
export default async function Page() {
  const t = await getTranslations("Content");
  return (
    <PublicShell title={t("statusPage")} description={t("statusDescription")}>
      <AreaLinks />
      <Suspense fallback={<Empty>{t("unavailable")}</Empty>}>
        <NetworkStatusPanel />
      </Suspense>
      <h2 className="font-display text-2xl">{t("modalities")}</h2>
      <p className="text-sm text-muted-foreground">{t("staffStatus")}</p>
      <ModalityCards />
      <h2 className="font-display text-2xl">{t("maintenance")}</h2>
      <PostsFeed type="MAINTENANCE" />
    </PublicShell>
  );
}
