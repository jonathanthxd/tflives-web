"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("Footer");
  const pathname = usePathname();
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isMessagingRoute = pathname === "/mensajes" || pathname.startsWith("/mensajes/");

  if (isAdminRoute || isMessagingRoute) return null;

  return (
    <footer className="relative mt-14 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
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
            <Link href="/streamers" className="hover:text-primary transition-colors">
              {t("streamers")}
            </Link>
            <Link href="/comunidad" className="hover:text-primary">
              {t("comunidad")}
            </Link>
            <Link href="/trayectoria" className="hover:text-primary">
              {t("trayectoria")}
            </Link>
            <Link href="/network/tienda" className="hover:text-primary">
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

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground/60">
          <Link href="/privacidad" className="hover:text-primary transition-colors">
            {t("privacidad")}
          </Link>
          <Link href="/terminos" className="hover:text-primary transition-colors">
            {t("terminos")}
          </Link>
          <Link href="/cookies" className="hover:text-primary transition-colors">
            {t("cookies")}
          </Link>
          <Link href="/aviso-legal" className="hover:text-primary transition-colors">
            {t("avisoLegal")}
          </Link>
          <Link href="/normas" className="hover:text-primary transition-colors">
            {t("normas")}
          </Link>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground/70 md:text-left">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
