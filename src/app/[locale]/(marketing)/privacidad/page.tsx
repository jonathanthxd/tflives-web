import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

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
    <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="tfl-glass rounded-3xl border border-border p-6 sm:p-10">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")}</p>

        <div className="prose prose-invert mt-8 max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("introTitle")}
            </h2>
            <p>{t("intro")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("dataWeCollectTitle")}
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t("dataAccount")}</li>
              <li>{t("dataProfile")}</li>
              <li>{t("dataUsage")}</li>
              <li>{t("dataCookies")}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("howWeUseTitle")}
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t("useProvide")}</li>
              <li>{t("useImprove")}</li>
              <li>{t("useCommunicate")}</li>
              <li>{t("useSecurity")}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("dataSharingTitle")}
            </h2>
            <p>{t("dataSharing")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("dataRetentionTitle")}
            </h2>
            <p>{t("dataRetention")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("yourRightsTitle")}
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t("rightAccess")}</li>
              <li>{t("rightCorrection")}</li>
              <li>{t("rightDeletion")}</li>
              <li>{t("rightPortability")}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("childrenTitle")}
            </h2>
            <p>{t("children")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("changesTitle")}
            </h2>
            <p>{t("changes")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("contactTitle")}
            </h2>
            <p>{t("contact")}</p>
          </section>
        </div>
      </div>
    </main>
  );
}
