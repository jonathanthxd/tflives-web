import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { publicWiki, translated } from "@/modules/editorial/publication";
import { prisma } from "@/infrastructure/database/prisma";
import {
  PublicShell,
  Empty,
  AreaLinks,
  StaffLink,
  panel,
  grid,
  PublicSectionSkeleton,
} from "@/modules/network/components/public-content";
import { contentMetadata } from "@/modules/editorial/metadata";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCachedWikiFilters } from "@/modules/network/cache/public-content-cache";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return contentMetadata("wiki", "wikiDescription", "/network/wiki", locale);
}

type WikiSearchParams = Promise<{
  q?: string;
  category?: string;
  modality?: string;
  tag?: string;
}>;

async function WikiExplorer({
  searchParams,
  locale,
}: {
  searchParams: WikiSearchParams;
  locale: Locale;
}) {
  const [query, t] = await Promise.all([
    searchParams,
    getTranslations({ locale, namespace: "Content" }),
  ]);
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 200) : "";
  const categoryFilter =
    typeof query.category === "string" ? query.category : undefined;
  const modalityFilter =
    typeof query.modality === "string" ? query.modality : undefined;
  const tagFilter = typeof query.tag === "string" ? query.tag : undefined;
  const [{ categories, modes }, articles] = await Promise.all([
    getCachedWikiFilters(),
    prisma.wikiArticle.findMany({
      where: {
        AND: [
          publicWiki(),
          ...(q
            ? [
                {
                  OR: [
                    { title: { contains: q, mode: "insensitive" as const } },
                    { content: { contains: q, mode: "insensitive" as const } },
                    { excerpt: { contains: q, mode: "insensitive" as const } },
                    {
                      translations: {
                        path: [locale, "title"],
                        string_contains: q,
                      },
                    },
                    {
                      translations: {
                        path: [locale, "content"],
                        string_contains: q,
                      },
                    },
                  ],
                },
              ]
            : []),
        ],
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
        ...(modalityFilter ? { modalityId: modalityFilter } : {}),
        ...(tagFilter ? { tags: { has: tagFilter } } : {}),
      },
      include: { category: true },
      orderBy: { updatedAt: "desc" },
      take: 60,
    }),
  ]);
  const input =
    "block mt-2 w-full rounded-xl border border-border bg-background p-3";

  return (
    <>
      <form className={`${panel} grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
        <label>
          {t("search")}
          <input className={input} name="q" defaultValue={q} maxLength={200} />
        </label>
        <label>
          {t("categoryId")}
          <select
            className={input}
            name="category"
            defaultValue={categoryFilter ?? ""}
          >
            <option value="">{t("all")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {translated(category, locale).name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("modalityId")}
          <select
            className={input}
            name="modality"
            defaultValue={modalityFilter ?? ""}
          >
            <option value="">{t("all")}</option>
            {modes.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {translated(mode, locale).name}
              </option>
            ))}
          </select>
        </label>
        <button className="self-end rounded-xl bg-primary/10 p-3 text-primary">
          {t("search")}
        </button>
      </form>

      {articles.length ? (
        <div className={grid}>
          {articles.map((raw) => {
            const article = translated(raw, locale);
            return (
              <article className={panel} key={article.id}>
                <p className="text-xs text-primary">
                  {article.category &&
                    translated(article.category, locale).name}
                </p>
                <h2 className="mt-3 font-display text-xl font-semibold">
                  <Link href={`/network/wiki/${article.slug}`}>
                    {article.title}
                  </Link>
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  {t("updated")}: {article.updatedAt.toLocaleDateString(locale)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      className="text-xs text-primary"
                      href={`/network/wiki?tag=${encodeURIComponent(tag)}`}
                      key={tag}
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty>{t("wikiEmpty")}</Empty>
      )}
    </>
  );
}

export default async function WikiIndex({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: WikiSearchParams;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Content" });

  return (
    <PublicShell title={t("wiki")} description={t("wikiDescription")}>
      <AreaLinks locale={locale} />
      <Suspense fallback={null}>
        <StaffLink section="wiki" href="/admin/wiki" />
      </Suspense>
      <Suspense fallback={<PublicSectionSkeleton rows={6} />}>
        <WikiExplorer searchParams={searchParams} locale={locale} />
      </Suspense>
    </PublicShell>
  );
}
