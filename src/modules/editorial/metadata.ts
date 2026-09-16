import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export async function contentMetadata(
  titleKey: string,
  descriptionKey: string,
  path: string,
  requestedLocale?: Locale,
): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    requestedLocale
      ? getTranslations({ locale: requestedLocale, namespace: "Content" })
      : getTranslations("Content"),
    requestedLocale ? Promise.resolve(requestedLocale) : getLocale(),
  ]);

  return {
    title: `${t(titleKey)} | TFLives`,
    description: t(descriptionKey),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { es: `/es${path}`, en: `/en${path}` },
    },
  };
}
