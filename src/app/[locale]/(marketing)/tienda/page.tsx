import { getTranslations } from "next-intl/server";
import {
  PublicShell,
  AreaLinks,
} from "@/modules/network/components/public-content";
import { contentMetadata } from "@/modules/editorial/metadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () =>
  contentMetadata("shop", "shopDescription", "/tienda");
export default async function Page() {
  const t = await getTranslations("Content");
  return (
    <PublicShell title={t("shop")} description={t("shopDescription")}>
      <AreaLinks />
      <section className="rounded-2xl border border-primary/20 bg-card/50 p-8 space-y-6">
        <p className="text-muted-foreground">{t("externalShop")}</p>
        <a
          href="https://shop.tflives.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          {t("shopCta")}
        </a>
      </section>
    </PublicShell>
  );
}
