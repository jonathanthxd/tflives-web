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
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternatesFor(locale, "/privacidad"),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });

  return (
    <LegalPage title={t("title")} updated={t("lastUpdated")}>
      <LegalSection title={t("introTitle")}>
        <p>{t("intro")}</p>
      </LegalSection>

      <LegalSection title={t("dataWeCollectTitle")}>
        <ul className="list-disc pl-5 space-y-2">
          <li>{t("dataAccount")}</li>
          <li>{t("dataProfile")}</li>
          <li>{t("dataUsage")}</li>
          <li>{t("dataCookies")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("howWeUseTitle")}>
        <ul className="list-disc pl-5 space-y-2">
          <li>{t("useProvide")}</li>
          <li>{t("useImprove")}</li>
          <li>{t("useCommunicate")}</li>
          <li>{t("useSecurity")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("dataSharingTitle")}>
        <p>{t("dataSharing")}</p>
      </LegalSection>

      <LegalSection title={t("cookiesTitle")}>
        <p>{t("cookies")}</p>
      </LegalSection>

      <LegalSection title={t("dataRetentionTitle")}>
        <p>{t("dataRetention")}</p>
      </LegalSection>

      <LegalSection title={t("yourRightsTitle")}>
        <ul className="list-disc pl-5 space-y-2">
          <li>{t("rightAccess")}</li>
          <li>{t("rightCorrection")}</li>
          <li>{t("rightDeletion")}</li>
          <li>{t("rightPortability")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("childrenTitle")}>
        <p>{t("children")}</p>
      </LegalSection>

      <LegalSection title={t("securityTitle")}>
        <p>{t("security")}</p>
      </LegalSection>

      <LegalSection title={t("changesTitle")}>
        <p>{t("changes")}</p>
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
