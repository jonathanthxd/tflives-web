import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import {
  AreaLinks,
  PostsFeed,
  ModalityCards,
  TimelineCards,
  PublicSectionSkeleton,
} from "@/modules/network/components/public-content";
import {
  NetworkStatusPanel,
  DiscordPanel,
} from "@/modules/network/components/status-panel";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import OwnersSection from "@/modules/administration/components/owners-section";
import HeroGlow from "@/shared/ui/effects/hero-glow";
import Reveal from "@/shared/ui/reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Content" });
  return {
    title: "TFLives — Time For Lives",
    description: t("homeDescription"),
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const [t, c] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getTranslations({ locale, namespace: "Content" }),
  ]);

  return (
    <main className="relative overflow-hidden pt-16 md:pt-20">
      <section className="relative min-h-[calc(100svh-4rem)] md:min-h-[calc(100svh-5rem)] flex flex-col items-center justify-center">
        <HeroGlow />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            <span className="text-foreground">TFL</span>
            <span className="text-primary">ives</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            {t("subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/proyectos"
              className="px-8 py-4 border border-muted-foreground/30 rounded-xl text-muted-foreground font-medium transition-all duration-300 hover:border-primary/50 hover:text-primary"
            >
              {t("explorarNetwork")}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-2 text-muted-foreground/50 animate-bounce md:bottom-12">
          <span className="text-xs uppercase tracking-widest">
            {t("scroll")}
          </span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10 py-12">
        <h2 className="font-display text-3xl font-semibold">{c("ecosystem")}</h2>
        <AreaLinks locale={locale} />

        <Suspense fallback={<PublicSectionSkeleton rows={4} />}>
          <NetworkStatusPanel />
        </Suspense>
        <Suspense fallback={<PublicSectionSkeleton rows={3} />}>
          <DiscordPanel />
        </Suspense>

        <h2 className="font-display text-3xl font-semibold">{c("latest")}</h2>
        <Suspense fallback={<PublicSectionSkeleton rows={3} />}>
          <PostsFeed locale={locale} limit={3} paginated={false} />
        </Suspense>

        <h2 className="font-display text-3xl font-semibold">{c("modalities")}</h2>
        <Suspense fallback={<PublicSectionSkeleton rows={3} />}>
          <ModalityCards locale={locale} limit={3} />
        </Suspense>

        <h2 className="font-display text-3xl font-semibold">{c("timeline")}</h2>
        <Suspense fallback={<PublicSectionSkeleton rows={3} />}>
          <TimelineCards locale={locale} limit={3} />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <Reveal>
          <OwnersSection />
        </Reveal>
      </Suspense>
    </main>
  );
}
