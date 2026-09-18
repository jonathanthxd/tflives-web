import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/database/prisma";
import { publicWiki, translated } from "@/modules/editorial/publication";
import {
  PublicShell,
  StaffLink,
  panel,
} from "@/modules/network/components/public-content";
import ArticleBody from "@/modules/wiki/components/article-body";
import { articleHeadings } from "@/modules/wiki/headings";
import { Link } from "@/i18n/navigation";
import { localePath } from "@/config/site";
import { JsonLd } from "@/shared/seo/json-ld";
import { articleNode } from "@/shared/seo/schema";
type Props = { params: Promise<{ slug: string; locale: string }> };
export const instant = false;
export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params;
  const row = await prisma.wikiArticle.findFirst({
    where: { slug, ...publicWiki() },
  });
  if (!row) return { title: "Wiki | TFLives", robots: { index: false } };
  const item = translated(row, locale);
  return {
    title: `${item.title} | TFLives Wiki`,
    description: item.excerpt ?? undefined,
    alternates: {
      canonical: `/${locale}/network/wiki/${slug}`,
      languages: {
        es: `/es/network/wiki/${slug}`,
        en: `/en/network/wiki/${slug}`,
      },
    },
  };
}
export default async function WikiArticlePage({ params }: Props) {
  const [{ slug }, locale, t] = await Promise.all([
    params,
    getLocale(),
    getTranslations("Content"),
  ]);
  const raw = await prisma.wikiArticle.findFirst({
    where: { slug, ...publicWiki() },
    include: {
      category: true,
      editor: { select: { name: true } },
      modality: true,
    },
  });
  if (!raw) notFound();
  const article = translated(raw, locale);
  const headings = articleHeadings(article.content);
  const related = await prisma.wikiArticle.findMany({
    where: {
      AND: [
        publicWiki(),
        { id: { not: article.id } },
        {
          OR: [
            ...(article.categoryId ? [{ categoryId: article.categoryId }] : []),
            ...(article.modalityId ? [{ modalityId: article.modalityId }] : []),
            { tags: { hasSome: article.tags } },
          ],
        },
      ],
    },
    take: 3,
    orderBy: { updatedAt: "desc" },
  });
  return (
    <PublicShell
      title={article.title}
      description={article.excerpt ?? undefined}
    >
      <JsonLd
        data={articleNode({
          locale,
          headline: article.title,
          description: article.excerpt ?? undefined,
          path: localePath(locale, `/network/wiki/${slug}`),
          datePublished: (article.publishedAt ?? article.createdAt).toISOString(),
          dateModified: article.updatedAt.toISOString(),
          authorName: article.editor.name,
          section: article.category
            ? translated(article.category, locale).name
            : undefined,
        })}
      />
      <nav className="flex flex-wrap gap-3 text-sm text-primary">
        <Link href="/network">TFL Network</Link>
        <span>/</span>
        <Link href="/network/wiki">{t("wiki")}</Link>
        {article.category && (
          <>
            <span>/</span>
            <Link href={`/network/wiki?category=${article.categoryId}`}>
              {translated(article.category, locale).name}
            </Link>
          </>
        )}
      </nav>
      <StaffLink section="wiki" href={`/admin/wiki/${article.id}`} />
      <p className="text-sm text-muted-foreground">
        {t("updated")}: {article.updatedAt.toLocaleDateString(locale)} ·{" "}
        {article.editor.name}
      </p>
      <div className="flex flex-wrap gap-2">
        {article.tags.map((tag) => (
          <Link
            key={tag}
            href={`/network/wiki?tag=${encodeURIComponent(tag)}`}
            className="text-sm text-primary"
          >
            #{tag}
          </Link>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
        <article className="min-w-0">
          <ArticleBody content={article.content} />
        </article>
        {!!headings.length && (
          <aside className="order-first lg:order-last">
            <nav
              className={`${panel} lg:sticky lg:top-28`}
              aria-label={t("toc")}
            >
              <h2 className="mb-4 font-semibold">{t("toc")}</h2>
              <ol className="space-y-3">
                {headings.map((h) => (
                  <li
                    key={h.id}
                    style={{ paddingLeft: Math.min(h.level - 1, 3) * 8 }}
                  >
                    <a
                      className="text-sm text-muted-foreground hover:text-primary"
                      href={`#${h.id}`}
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        )}
      </div>
      {!!related.length && (
        <section>
          <h2 className="mb-5 font-display text-2xl">{t("relatedArticles")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/network/wiki/${r.slug}`}
                className={panel}
              >
                {translated(r, locale).title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </PublicShell>
  );
}
