import { ArrowUpRight, Blocks, RadioTower, UsersRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata() {
  const t = await getTranslations("Projects");
  return {
    title: `${t("title")} — TFLives`,
    description: t("description"),
  };
}

export default async function ProjectsPage() {
  const t = await getTranslations("Projects");

  const projects = [
    {
      key: "network",
      href: "/network" as const,
      icon: Blocks,
      detailIcon: RadioTower,
    },
    {
      key: "community",
      href: "/comunidad" as const,
      icon: UsersRound,
      detailIcon: UsersRound,
    },
  ] as const;

  return (
    <main className="content-surface min-h-screen pt-28 pb-20 md:pt-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">TIME FOR LIVES</p>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">{t("title")}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{t("description")}</p>
        </header>

        <section className="mt-12 grid gap-5 md:grid-cols-2 md:gap-6" aria-label={t("title")}>
          {projects.map(({ key, href, icon: Icon, detailIcon: DetailIcon }, index) => (
            <article
              key={key}
              className="tfl-glass tfl-glass-soft group relative isolate min-h-[23rem] overflow-hidden rounded-[2rem] border border-primary/15 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_22px_60px_-34px_hsl(var(--primary)/0.34)] sm:p-8"
            >
              <div
                className={`pointer-events-none absolute inset-0 -z-10 opacity-80 ${
                  index === 0
                    ? "bg-[radial-gradient(circle_at_18%_15%,hsl(var(--primary)/0.20),transparent_38%)]"
                    : "bg-[radial-gradient(circle_at_82%_12%,hsl(var(--primary)/0.18),transparent_40%)]"
                }`}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-t from-primary/[0.055] to-transparent" />

              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-inner shadow-primary/5">
                    <Icon className="size-6" strokeWidth={1.7} />
                  </span>
                  <span className="tfl-glass-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    <DetailIcon className="size-3.5 text-primary" />
                    {t(`${key}.eyebrow`)}
                  </span>
                </div>

                <div className="mt-12">
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t(`${key}.title`)}</h2>
                  <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">{t(`${key}.description`)}</p>
                </div>

                <div className="mt-auto pt-8">
                  <Link
                    href={href}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-primary/25"
                  >
                    {t(`${key}.cta`)}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground/75">{t("footer")}</p>
      </div>
    </main>
  );
}
