import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/database/prisma";
import { publicModalities, translated } from "@/modules/editorial/publication";
import {
  PublicShell,
  AreaLinks,
  PostsFeed,
  StaffLink,
} from "@/modules/network/components/public-content";
import ArticleBody from "@/modules/wiki/components/article-body";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string; locale: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params;
  const row = await prisma.modality.findFirst({
    where: { slug, ...publicModalities },
  });
  if (!row) return { robots: { index: false } };
  const mode = translated(row, locale);
  return {
    title: `${mode.name} | TFL Network`,
    description: mode.description ?? undefined,
    alternates: { canonical: `/${locale}/network/modalidades/${slug}` },
  };
}
export default async function Page({ params }: Props) {
  const [{ slug }, locale, t] = await Promise.all([
    params,
    getLocale(),
    getTranslations("Content"),
  ]);
  const row = await prisma.modality.findFirst({
    where: { slug, ...publicModalities },
  });
  if (!row) notFound();
  const mode = translated(row, locale);
  return (
    <PublicShell title={mode.name} description={mode.description ?? undefined}>
      <AreaLinks />
      <p className="text-primary">
        {t(mode.status)}
        {mode.minecraftVersion && ` · ${mode.minecraftVersion}`}
      </p>
      {mode.banner && (
        <img
          src={mode.banner}
          alt=""
          className="max-h-96 w-full rounded-2xl object-cover"
        />
      )}
      <StaffLink section="modalities" href="/admin/modalities" />
      {mode.content && <ArticleBody content={mode.content} />}
      <h2 className="font-display text-2xl">{t("latest")}</h2>
      <PostsFeed modalityId={mode.id} />
    </PublicShell>
  );
}
