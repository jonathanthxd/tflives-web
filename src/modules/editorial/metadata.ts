import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
export async function contentMetadata(
  titleKey: string,
  descriptionKey: string,
  path: string,
): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("Content"),
    getLocale(),
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
