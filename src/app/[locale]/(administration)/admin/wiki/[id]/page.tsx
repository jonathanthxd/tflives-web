import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/database/prisma";
import { requireSectionPage } from "@/modules/administration/page-guard";
import ContentManager from "@/modules/administration/components/content-manager";

export const instant = false;
export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  await requireSectionPage("wiki", locale);
  const [article, modalities, categories, t] = await Promise.all([
    prisma.wikiArticle.findUnique({ where: { id } }),
    prisma.modality.findMany({ select: { id: true, name: true }, orderBy: { order: "asc" } }),
    prisma.wikiCategory.findMany({ select: { id: true, name: true }, orderBy: { order: "asc" } }),
    getTranslations("Content"),
  ]);
  if (!article) notFound();
  return <div><h1 className="mb-6 font-display text-2xl">{t("wiki")}</h1><ContentManager kind="wiki" initialItems={[]} initialEdit={JSON.parse(JSON.stringify(article))} modalities={modalities} categories={categories} /></div>;
}
