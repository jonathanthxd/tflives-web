"use client";

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

const navLinkClass =
  "relative inline-flex min-h-11 items-center whitespace-nowrap text-sm font-medium tracking-wide text-muted-foreground transition-colors duration-200 hover:text-primary after:absolute after:bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary/70 after:transition-all after:duration-200 hover:after:w-full aria-[current=page]:text-primary aria-[current=page]:after:w-full";

export default function Navbar() {
  const t = useTranslations("Navbar");
  const tUser = useTranslations("UserMenu");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isAuthRoute = MINIMAL_HEADER_ROUTES.includes(pathname);

  const [mobileOpen, setMobileOpen] = useState(false);
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

  return (
    <nav className="fixed inset-x-0 top-0 z-50" aria-label="TFLives">
      <div className="absolute inset-0 border-b border-primary/10 bg-background/70 shadow-lg shadow-black/5 backdrop-blur-xl" />

      <div className="relative w-full px-3 sm:px-5 lg:px-6">
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-20">
          {/* Utilities */}
          <div className="flex min-w-0 items-center justify-start gap-0.5">
            <StudioMenu />
            <Link
              href={pathname}
              locale={locale === "es" ? "en" : "es"}
              className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-semibold uppercase text-muted-foreground transition-colors duration-200 hover:bg-primary/5 hover:text-primary"
            >
              {locale === "es" ? "EN" : "ES"}
            </Link>
          </div>

          {/* Primary navigation: deliberately symmetrical around the brand. */}
          <div className="flex items-center justify-center">
            <div className="hidden items-center lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-5 xl:gap-6">
              <div className="flex items-center justify-end gap-5 xl:gap-6">
                <Link
                  href="/streamers"
                  aria-current={isCurrent("/streamers") ? "page" : undefined}
                  className={navLinkClass}
                >
                  {t("streamers")}
                </Link>
                <Link
                  href="/proyectos"
                  aria-current={isCurrent("/proyectos") ? "page" : undefined}
                  className={navLinkClass}
                >
                  {t("proyectos")}
                </Link>
              </div>

              <Link
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
                className="group flex min-h-11 min-w-[96px] flex-col items-center justify-center px-1"
              >
                <span className="font-display text-xl font-bold tracking-tight transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)] md:text-2xl lg:text-3xl">
                  <span className="text-foreground transition-colors duration-300 group-hover:text-primary">TFL</span>
                  <span className="text-primary">ives</span>
                </span>
                <span className="mt-0.5 h-px w-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-all duration-300 group-hover:w-full" />
              </Link>

              <div className="flex items-center justify-start gap-5 xl:gap-6">
                <Link
                  href="/cosmeticos"
                  aria-current={isCurrent("/cosmeticos") ? "page" : undefined}
                  className={navLinkClass}
                >
                  {t("cosmeticos")}
                </Link>
                <Link
                  href="/trayectoria"
                  aria-current={isCurrent("/trayectoria") ? "page" : undefined}
                  className={navLinkClass}
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
          <div className="flex min-w-0 items-center justify-end gap-1">
            {user ? (
              <>
                <div className="hidden items-center rounded-xl border border-border/60 bg-background/45 p-0.5 shadow-sm sm:flex">
                  <NotificationBell userId={user.id} />
                  <MessagingUnreadLink />
                </div>
                <NotificationToasts />
                <UserMenu
                  displayName={displayName}
                  username={user.username}
                  role={user.role}
                  image={user.image}
                  onLogout={handleLogout}
                />
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-muted-foreground/20 px-3 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary md:px-4 md:text-sm"
              >
                {t("login")}
              </Link>
            )}

            {user && <GlobalChat userId={user.id} />}

            <button
              onClick={() => setMobileOpen((value) => !value)}
              aria-expanded={mobileOpen}
              aria-controls="site-mobile-menu"
              aria-label={mobileOpen ? t("cerrarMenu") : t("abrirMenu")}
              className="ml-0.5 grid min-h-11 min-w-11 place-items-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-primary/5 hover:text-primary lg:hidden"
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
      </div>

      <div
        id="site-mobile-menu"
        className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "max-h-[calc(100dvh-4rem)] opacity-100" : "pointer-events-none max-h-0 opacity-0"
        }`}
      >
        <div className="border-b border-primary/10 bg-background/95 shadow-inner backdrop-blur-xl">
          <div className="safe-area-bottom max-h-[calc(100dvh-4rem)] overflow-y-auto px-4 py-4">
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
    </nav>
  );
}
