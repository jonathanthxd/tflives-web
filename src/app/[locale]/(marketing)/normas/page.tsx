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
  const t = await getTranslations({ locale, namespace: "CommunityGuidelines" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternatesFor(locale, "/normas"),
  };
}

export default async function CommunityGuidelinesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CommunityGuidelines" });

  return (
    <LegalPage title={t("title")} updated={t("lastUpdated")}>
      <LegalSection title={t("introTitle")}>
        <p>{t("intro")}</p>
      </LegalSection>

      <LegalSection title={t("respectTitle")}>
        <p>{t("respect")}</p>
      </LegalSection>

      <LegalSection title={t("safetyTitle")}>
        <p>{t("safety")}</p>
      </LegalSection>

      <LegalSection title={t("minorsTitle")}>
        <p>{t("minors")}</p>
      </LegalSection>

      <LegalSection title={t("contentTitle")}>
        <p>{t("content")}</p>
      </LegalSection>

      <LegalSection title={t("gamesTitle")}>
        <p>{t("games")}</p>
      </LegalSection>

      <LegalSection title={t("reportingTitle")}>
        <p>{t("reporting")}</p>
      </LegalSection>

      <LegalSection title={t("enforcementTitle")}>
        <p>{t("enforcement")}</p>
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
