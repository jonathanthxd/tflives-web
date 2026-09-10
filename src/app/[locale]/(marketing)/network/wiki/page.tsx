import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/infrastructure/database/prisma";
import {
  publicWiki,
  publicModalities,
  translated,
} from "@/modules/editorial/publication";
import {
  PublicShell,
  Empty,
  AreaLinks,
  StaffLink,
  panel,
  grid,
} from "@/modules/network/components/public-content";
import { contentMetadata } from "@/modules/editorial/metadata";
import { Link } from "@/i18n/navigation";
export const dynamic = "force-dynamic";
export const generateMetadata = () =>
  contentMetadata("wiki", "wikiDescription", "/network/wiki");
export default async function WikiIndex({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    modality?: string;
    tag?: string;
  }>;
}) {
  const [query, locale, t] = await Promise.all([
    searchParams,
    getLocale(),
    getTranslations("Content"),
  ]);
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 200) : "";
  const categoryFilter = typeof query.category === "string" ? query.category : undefined;
  const modalityFilter = typeof query.modality === "string" ? query.modality : undefined;
  const tagFilter = typeof query.tag === "string" ? query.tag : undefined;
  const [articles, categories, modes] = await Promise.all([
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
    prisma.wikiCategory.findMany({
      where: { articles: { some: publicWiki() } },
      orderBy: { order: "asc" },
    }),
    prisma.modality.findMany({
      where: publicModalities,
      orderBy: { order: "asc" },
    }),
  ]);
  const input =
    "block mt-2 w-full rounded-xl border border-border bg-background p-3";
  return (
    <PublicShell title={t("wiki")} description={t("wikiDescription")}>
      <AreaLinks />
      <StaffLink section="wiki" href="/admin/wiki" />
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
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {translated(c, locale).name}
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
            {modes.map((m) => (
              <option key={m.id} value={m.id}>
                {translated(m, locale).name}
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
    </PublicShell>
  );
}
