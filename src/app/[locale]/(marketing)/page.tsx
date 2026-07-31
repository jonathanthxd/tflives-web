import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import OwnersSection from "@/modules/administration/components/owners-section";
import HeroGlow from "@/shared/ui/effects/hero-glow";
import Reveal from "@/shared/ui/reveal";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <main className="relative overflow-hidden pt-20">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center">
        <HeroGlow />

        {/* Content */}
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
              href="/network"
              className="px-8 py-4 border border-muted-foreground/30 rounded-xl text-muted-foreground font-medium transition-all duration-300 hover:border-primary/50 hover:text-primary"
            >
              {t("explorarNetwork")}
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 text-muted-foreground/50 animate-bounce">
          <span className="text-xs uppercase tracking-widest">{t("scroll")}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Owners Section */}
      <Reveal>
        <OwnersSection />
      </Reveal>
    </main>
  );
}
