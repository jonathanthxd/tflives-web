"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { authClient } from "@/infrastructure/auth/client";
import AuthHeader from "@/shared/ui/layout/auth-header";
import UserMenu from "@/shared/ui/layout/user-menu";
import NotificationBell from "@/modules/notifications/components/notification-bell";
import NotificationToasts from "@/modules/notifications/components/notification-toasts";
import GlobalChat from "@/modules/chat/components/global-chat";
import MessagingUnreadLink from "@/modules/messaging/components/messaging-unread-link";
import StudioMenu from "@/shared/ui/studio/studio-menu";

const MINIMAL_HEADER_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/two-factor",
  "/verify-email",
];

const NAV_LAYOUT_TRANSITION = {
  type: "spring" as const,
  stiffness: 430,
  damping: 38,
  mass: 0.72,
};

function navLinkClass(compact: boolean) {
  return [
    "relative inline-flex min-h-11 items-center whitespace-nowrap text-sm font-medium text-muted-foreground",
    "transition-[color,letter-spacing] duration-300 ease-out hover:text-primary",
    compact ? "tracking-[0.012em]" : "tracking-[0.035em]",
    "after:absolute after:bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary/70",
    "after:transition-all after:duration-300 hover:after:w-full aria-[current=page]:text-primary aria-[current=page]:after:w-full",
  ].join(" ");
}

export default function Navbar() {
  const t = useTranslations("Navbar");
  const tUser = useTranslations("UserMenu");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isAuthRoute = MINIMAL_HEADER_ROUTES.includes(pathname);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    name: string | null;
    username: string | null;
    role: string;
    image: string | null;
  } | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      setUser(null);
      return;
    }

    let cancelled = false;
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.user) {
          setUser({
            id: data.user.id,
            name: data.user.displayName || data.user.name || null,
            username: data.user.username || null,
            role: data.user.role,
            image: data.user.image || null,
          });
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled((current) => (current ? y > 3 : y > 12));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const handleLogout = async () => {
    await authClient.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const displayName = user?.name || user?.username || "";

  if (isAuthRoute) return <AuthHeader />;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  const isCurrent = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  // Opening the mobile drawer intentionally expands the shell again so the
  // navigation never feels squeezed into a pill while it contains a menu.
  const compact = scrolled && !mobileOpen;

  return (
    <>
      <nav
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-2 sm:px-3 lg:px-4"
      aria-label="TFLives"
    >
      <motion.div
        initial={false}
        className={`tfl-glass pointer-events-auto relative isolate border transition-[width,border-radius,margin] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[width,border-radius] ${
          compact
            ? "mt-2 w-[min(96%,74rem)] rounded-full"
            : "mt-1 w-full rounded-[22px] md:mt-2"
        }`}
      >
        {/* Premium glass layers live in their own clipped plane so menus can overflow the shell. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
          <motion.div
            animate={{ opacity: compact ? 0.8 : 0.55 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 bg-gradient-to-b from-primary/[0.045] via-foreground/[0.012] to-transparent dark:from-white/[0.035] dark:via-primary/[0.012]"
          />
          <motion.div
            animate={{ opacity: compact ? 0.3 : 0.16, scaleX: compact ? 0.78 : 1 }}
            transition={NAV_LAYOUT_TRANSITION}
            className="absolute inset-x-[16%] -bottom-5 h-9 rounded-full bg-primary/35 blur-3xl"
          />
          <div className="absolute inset-x-10 top-px h-px bg-gradient-to-r from-transparent via-white/28 to-transparent dark:via-white/12" />

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={compact ? "compact" : "expanded"}
              initial={{ x: "-150%", opacity: 0 }}
              animate={{ x: "285%", opacity: [0, 0.32, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -inset-y-8 w-[24%] -skew-x-12 bg-gradient-to-r from-transparent via-primary/16 to-transparent blur-md dark:via-white/[0.07]"
            />
          </AnimatePresence>
        </div>

        <div
          className={`relative grid grid-cols-[1fr_auto_1fr] items-center transition-[height,padding] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            compact
              ? "h-14 px-2 sm:px-3 md:h-[60px] lg:px-4"
              : "h-[60px] px-2.5 sm:px-4 md:h-[72px] lg:px-5"
          }`}
        >
          {/* Utilities */}
          <div
            className={`flex min-w-0 items-center justify-start transition-[gap] duration-500 ${
              compact ? "gap-0" : "gap-0.5"
            }`}
          >
            <StudioMenu compact={compact} />
            <Link
              href={pathname}
              locale={locale === "es" ? "en" : "es"}
              className={`inline-flex min-h-11 items-center px-2 text-xs font-semibold uppercase text-muted-foreground transition-[color,background-color,border-radius,letter-spacing] duration-300 hover:bg-primary/5 hover:text-primary ${
                compact ? "rounded-full tracking-[0.02em]" : "rounded-xl tracking-[0.07em]"
              }`}
            >
              {locale === "es" ? "EN" : "ES"}
            </Link>
          </div>

          {/* Primary navigation: deliberately symmetrical around the brand. */}
          <div className="flex items-center justify-center">
            <div
              className={`hidden items-center transition-[column-gap] duration-500 lg:grid lg:grid-cols-[1fr_auto_1fr] ${
                compact ? "lg:gap-3.5 xl:gap-4" : "lg:gap-5 xl:gap-6"
              }`}
            >
              <div
                className={`flex items-center justify-end transition-[gap] duration-500 ${
                  compact ? "gap-3.5 xl:gap-4" : "gap-5 xl:gap-6"
                }`}
              >
                <Link
                  href="/streamers"
                  aria-current={isCurrent("/streamers") ? "page" : undefined}
                  className={navLinkClass(compact)}
                >
                  {t("streamers")}
                </Link>
                <Link
                  href="/proyectos"
                  aria-current={isCurrent("/proyectos") ? "page" : undefined}
                  className={navLinkClass(compact)}
                >
                  {t("proyectos")}
                </Link>
              </div>

              <Link
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
                className={`group flex min-h-11 flex-col items-center justify-center px-1 transition-[min-width] duration-500 ${
                  compact ? "min-w-[84px]" : "min-w-[96px]"
                }`}
              >
                <span className="font-display text-xl font-bold tracking-tight transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)] md:text-2xl lg:text-3xl">
                  <span className="text-foreground transition-colors duration-300 group-hover:text-primary">TFL</span>
                  <span className="text-primary">ives</span>
                </span>
                <span className="mt-0.5 h-px w-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-all duration-300 group-hover:w-full" />
              </Link>

              <div
                className={`flex items-center justify-start transition-[gap] duration-500 ${
                  compact ? "gap-3.5 xl:gap-4" : "gap-5 xl:gap-6"
                }`}
              >
                <Link
                  href="/cosmeticos"
                  aria-current={isCurrent("/cosmeticos") ? "page" : undefined}
                  className={navLinkClass(compact)}
                >
                  {t("cosmeticos")}
                </Link>
                <Link
                  href="/trayectoria"
                  aria-current={isCurrent("/trayectoria") ? "page" : undefined}
                  className={navLinkClass(compact)}
                >
                  {t("trayectoria")}
                </Link>
              </div>
            </div>

            <Link
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              className="group flex min-h-11 flex-col items-center justify-center lg:hidden"
            >
              <span className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                <span className="text-foreground">TFL</span>
                <span className="text-primary">ives</span>
              </span>
            </Link>
          </div>

          {/* Account utilities */}
          <div
            className={`flex min-w-0 items-center justify-end transition-[gap] duration-500 ${
              compact ? "gap-0 sm:gap-0.5" : "gap-0.5 sm:gap-1"
            }`}
          >
            {user ? (
              <>
                <div className="flex items-center">
                  <NotificationBell userId={user.id} compact={compact} />
                  <span className="hidden sm:inline-flex"><MessagingUnreadLink compact={compact} /></span>
                </div>
                <UserMenu
                  displayName={displayName}
                  username={user.username}
                  role={user.role}
                  image={user.image}
                  onLogout={handleLogout}
                  compact={compact}
                />
              </>
            ) : (
              <Link
                href="/login"
                className={`tfl-glass-chip inline-flex min-h-11 items-center whitespace-nowrap border px-3 text-xs font-medium text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:text-primary md:px-4 md:text-sm ${
                  compact ? "rounded-full" : "rounded-xl"
                }`}
              >
                {t("login")}
              </Link>
            )}

            <button
              onClick={() => setMobileOpen((value) => !value)}
              aria-expanded={mobileOpen}
              aria-controls="site-mobile-menu"
              aria-label={mobileOpen ? t("cerrarMenu") : t("abrirMenu")}
              className={`ml-0.5 grid min-h-11 min-w-11 place-items-center text-muted-foreground transition-[color,background-color,border-radius] duration-300 hover:bg-primary/5 hover:text-primary lg:hidden ${
                compact ? "rounded-full" : "rounded-xl"
              }`}
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          id="site-mobile-menu"
          className={`relative overflow-hidden transition-[max-height,opacity] duration-300 ease-out lg:hidden ${
            mobileOpen ? "max-h-[calc(100dvh-5rem)] opacity-100" : "pointer-events-none max-h-0 opacity-0"
          }`}
        >
          <div className="tfl-glass-bar border-t">
            <div className="safe-area-bottom max-h-[calc(100dvh-5rem)] overflow-y-auto px-4 py-4">
              <div className="grid gap-1 sm:grid-cols-2">
                <Link href="/" className="flex min-h-11 items-center rounded-xl px-3 font-medium text-primary hover:bg-primary/5" onClick={() => setMobileOpen(false)}>
                  TFLives
                </Link>
                <Link href="/proyectos" className="flex min-h-11 items-center rounded-xl px-3 text-muted-foreground hover:bg-primary/5 hover:text-primary" onClick={() => setMobileOpen(false)}>
                  {t("proyectos")}
                </Link>
                <Link href="/streamers" className="flex min-h-11 items-center rounded-xl px-3 text-muted-foreground hover:bg-primary/5 hover:text-primary" onClick={() => setMobileOpen(false)}>
                  {t("streamers")}
                </Link>
                <Link href="/cosmeticos" className="flex min-h-11 items-center rounded-xl px-3 text-muted-foreground hover:bg-primary/5 hover:text-primary" onClick={() => setMobileOpen(false)}>
                  {t("cosmeticos")}
                </Link>
                <Link href="/trayectoria" className="flex min-h-11 items-center rounded-xl px-3 text-muted-foreground hover:bg-primary/5 hover:text-primary" onClick={() => setMobileOpen(false)}>
                  {t("trayectoria")}
                </Link>
                <Link href="/privacidad" className="flex min-h-11 items-center rounded-xl px-3 text-muted-foreground hover:bg-primary/5 hover:text-primary" onClick={() => setMobileOpen(false)}>
                  {t("privacidad")}
                </Link>
                <Link href="/terminos" className="flex min-h-11 items-center rounded-xl px-3 text-muted-foreground hover:bg-primary/5 hover:text-primary" onClick={() => setMobileOpen(false)}>
                  {t("terminos")}
                </Link>
              </div>

              {user ? (
                <div className="mt-3 space-y-1 border-t border-primary/10 pt-3">
                  <Link
                    href={user.username ? `/perfil/${user.username}` : "/onboarding/username"}
                    className="flex min-h-11 items-center rounded-xl px-3 font-medium text-primary hover:bg-primary/5"
                    onClick={() => setMobileOpen(false)}
                  >
                    {tUser("miPerfil")}
                  </Link>
                  <Link href="/mensajes" className="flex min-h-11 items-center rounded-xl px-3 text-muted-foreground hover:bg-primary/5 hover:text-primary" onClick={() => setMobileOpen(false)}>
                    {t("mensajes")}
                  </Link>
                  {(user.role === "ADMIN" || user.role === "MOD") && (
                    <Link href="/admin" className="flex min-h-11 items-center rounded-xl px-3 text-foreground hover:bg-primary/5 hover:text-primary" onClick={() => setMobileOpen(false)}>
                      {tUser("panelAdmin")}
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-red-700 hover:bg-destructive/10 dark:text-red-400"
                  >
                    {tUser("cerrarSesion")}
                  </button>
                </div>
              ) : (
                <div className="mt-3 border-t border-primary/10 pt-3">
                  <Link href="/login" className="flex min-h-11 items-center rounded-xl px-3 text-muted-foreground hover:bg-primary/5 hover:text-primary" onClick={() => setMobileOpen(false)}>
                    {t("login")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      </nav>
      {user && (
        <>
          <NotificationToasts />
          <GlobalChat userId={user.id} />
        </>
      )}
    </>
  );
}
