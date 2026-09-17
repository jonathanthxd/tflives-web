import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Terms" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Terms" });

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
              {t("acceptanceTitle")}
            </h2>
            <p>{t("acceptance")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("accountsTitle")}
            </h2>
            <p>{t("accounts")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("conductTitle")}
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t("conductNoHarassment")}</li>
              <li>{t("conductNoExploits")}</li>
              <li>{t("conductNoSpam")}</li>
              <li>{t("conductNoIllegal")}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("ipTitle")}
            </h2>
            <p>{t("ip")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("userContentTitle")}
            </h2>
            <p>{t("userContent")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("virtualItemsTitle")}
            </h2>
            <p>{t("virtualItems")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("terminationTitle")}
            </h2>
            <p>{t("termination")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("disclaimerTitle")}
            </h2>
            <p>{t("disclaimer")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("limitationTitle")}
            </h2>
            <p>{t("limitation")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("governingLawTitle")}
            </h2>
            <p>{t("governingLaw")}</p>
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
