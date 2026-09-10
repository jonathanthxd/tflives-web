"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function PlaceholderLink({ label }: { label: string }) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="hover:text-primary transition-colors"
    >
      {label}
    </a>
  );
}

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="relative border-t border-border mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-tight"
          >
            <span className="text-foreground">TFL</span>
            <span className="text-primary">ives</span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link
              href="/network"
              className="hover:text-primary transition-colors"
            >
              {t("network")}
            </Link>
            <PlaceholderLink label={t("streamers")} />
            <Link href="/comunidad" className="hover:text-primary">
              {t("comunidad")}
            </Link>
            <Link href="/trayectoria" className="hover:text-primary">
              {t("trayectoria")}
            </Link>
            <Link href="/tienda" className="hover:text-primary">
              {t("tienda")}
            </Link>
            <Link href="/equipo" className="hover:text-primary">
              {t("equipo")}
            </Link>
            <a
              href="https://discord.com/invite/c3jFPyJ9vd"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              {t("discord")}
            </a>
          </nav>
        </div>

        <p className="mt-8 text-center md:text-left text-xs text-muted-foreground/70">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
