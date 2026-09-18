import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/config/site";
import { DISCORD_INVITE } from "@/infrastructure/external-services/discord";
import { LegalPage, LegalSection } from "@/shared/ui/legal-page";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "LegalNotice" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternatesFor(locale, "/aviso-legal"),
  };
}

export default async function LegalNoticePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "LegalNotice" });

  return (
    <LegalPage title={t("title")} updated={t("lastUpdated")}>
      <LegalSection title={t("ownerTitle")}>
        <p>{t("owner")}</p>
      </LegalSection>

      <LegalSection title={t("purposeTitle")}>
        <p>{t("purpose")}</p>
      </LegalSection>

      <LegalSection title={t("hostingTitle")}>
        <p>{t("hosting")}</p>
      </LegalSection>

      <LegalSection title={t("ipTitle")}>
        <p>{t("ip")}</p>
      </LegalSection>

      <LegalSection title={t("linksTitle")}>
        <p>{t("links")}</p>
      </LegalSection>

      <LegalSection title={t("liabilityTitle")}>
        <p>{t("liability")}</p>
      </LegalSection>

      <LegalSection title={t("lawTitle")}>
        <p>{t("law")}</p>
      </LegalSection>

      <LegalSection title={t("contactTitle")}>
        <p>{t("contact")}</p>
        <a
          href={DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {t("contactDiscord")}
        </a>
      </LegalSection>
    </LegalPage>
  );
}
