import OwnersSection from "@/components/home/owners-section";

export default function Home() {
  return (
    <main className="relative overflow-hidden pt-20">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center">
        {/* Subtle glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-tfl-sky/8 rounded-full blur-[100px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            <span className="text-tfl-bone">TFL</span>
            <span className="text-tfl-sky">ives</span>
          </h1>

          <p className="text-tfl-stone text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            La red de servidores Minecraft más innovadora.
            SurvivalRPG, Skyblock, Gens Tycoon y más.
            Únete a la comunidad que redefine el gaming.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/network"
              className="px-8 py-4 border border-tfl-stone/30 rounded-xl text-tfl-stone font-medium transition-all duration-300 hover:border-tfl-sky/50 hover:text-tfl-sky"
            >
              Explorar Network
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 text-tfl-stone/50 animate-bounce">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Owners Section */}
      <OwnersSection />
    </main>
  );
}