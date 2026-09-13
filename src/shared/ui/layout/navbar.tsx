"use client";

import { useState, useEffect } from "react";
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

  if (isAuthRoute) {
    return <AuthHeader />;
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" aria-label="TFLives">
      {/* Glassmorphism */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-xl border-b border-primary/10 shadow-lg shadow-black/5" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Studio + locale switch */}
          <div className="flex-1 flex items-center justify-start gap-1">
            <StudioMenu />
            <Link
              href={pathname}
              locale={locale === "es" ? "en" : "es"}
              className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 uppercase"
            >
              {locale === "es" ? "EN" : "ES"}
            </Link>
          </div>

          {/* Center: Logo + Links (centrado absoluto) */}
          <div className="flex items-center gap-3 sm:gap-5 md:gap-7 flex-shrink-0">
            <Link
              href="/streamers"
              aria-current={pathname === "/streamers" || pathname.startsWith("/streamers/") ? "page" : undefined}
              className="hidden lg:inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300 tracking-wide"
            >
              {t("streamers")}
            </Link>
            <Link
              href="/comunidad"
              aria-current={pathname === "/comunidad" ? "page" : undefined}
              className="hidden md:inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-primary"
            >
              {t("comunidad")}
            </Link>

            <Link
              href="/network"
              aria-current={pathname === "/network" || pathname.startsWith("/network/") ? "page" : undefined}
              className="relative inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300 tracking-wide after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-primary/70 after:transition-all after:duration-300 hover:after:w-full whitespace-nowrap"
            >
              {t("network")}
            </Link>

            <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className="flex min-h-11 flex-col items-center justify-center group">
              <span className="font-display text-xl md:text-2xl lg:text-3xl font-bold tracking-tight transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)] whitespace-nowrap">
                <span className="text-foreground group-hover:text-primary transition-colors duration-300">
                  TFL
                </span>
                <span className="text-primary group-hover:text-primary transition-colors duration-300">
                  ives
                </span>
              </span>
              <span className="w-0 group-hover:w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-all duration-500 mt-0.5" />
            </Link>

            <Link
              href="/trayectoria"
              aria-current={pathname === "/trayectoria" ? "page" : undefined}
              className="hidden md:inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-primary"
            >
              {t("trayectoria")}
            </Link>
            <Link
              href="/tienda"
              aria-current={pathname === "/tienda" ? "page" : undefined}
              className="hidden lg:inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-primary"
            >
              {t("tienda")}
            </Link>
            <Link
              href="/cosmeticos"
              aria-current={pathname === "/cosmeticos" ? "page" : undefined}
              className="hidden lg:inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-primary"
            >
              {t("cosmeticos")}
            </Link>
            <Link
              href="/equipo"
              aria-current={pathname === "/equipo" ? "page" : undefined}
              className="hidden lg:inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-primary"
            >
              {t("equipo")}
            </Link>
          </div>

          {/* Right: User / Login (flex-1 para que ocupe espacio) */}
          <div className="flex-1 flex items-center justify-end">
            {user ? (
              <div className="flex items-center gap-1 md:gap-2">
                <Link
                  href="/amigos"
                  title={t("amigos")}
                  aria-label={t("amigos")}
                  className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition-all duration-300 hover:bg-primary/5 hover:text-primary md:inline-flex"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-16.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                </Link>
                <NotificationBell userId={user.id} />
                <NotificationToasts />
                <MessagingUnreadLink />
                <UserMenu
                  displayName={displayName}
                  username={user.username}
                  role={user.role}
                  image={user.image}
                  onLogout={handleLogout}
                />
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center px-3 md:px-4 text-xs md:text-sm font-medium text-muted-foreground border border-muted-foreground/20 rounded-full hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all duration-300 backdrop-blur-sm whitespace-nowrap"
              >
                {t("login")}
              </Link>
            )}

            {user && <GlobalChat userId={user.id} />}

            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="site-mobile-menu"
              aria-label={mobileOpen ? t("cerrarMenu") : t("abrirMenu")}
              className="ml-1 grid min-h-11 min-w-11 place-items-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 md:hidden"
            >
              {mobileOpen ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu (sin cambios) */}
      <div
        id="site-mobile-menu"
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen
            ? "max-h-[calc(100dvh-4rem)] opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-background/95 backdrop-blur-xl border-b border-primary/10 shadow-inner">
          <div className="safe-area-bottom max-h-[calc(100dvh-4rem)] overflow-y-auto px-4 py-4 space-y-1">
            <Link
              href="/"
              className="flex min-h-11 items-center rounded-lg px-2 text-primary font-medium hover:bg-primary/5"
              onClick={() => setMobileOpen(false)}
            >
              TFLives
            </Link>
            <Link
              href="/network"
              aria-current={pathname === "/network" || pathname.startsWith("/network/") ? "page" : undefined}
              className="flex min-h-11 items-center rounded-lg px-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {t("network")}
            </Link>
            <Link
              href="/streamers"
              onClick={() => setMobileOpen(false)}
              aria-current={pathname === "/streamers" || pathname.startsWith("/streamers/") ? "page" : undefined}
              className="flex min-h-11 items-center rounded-lg px-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
            >
              {t("streamers")}
            </Link>
            <Link
              href="/comunidad"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-2 text-muted-foreground hover:bg-primary/5 hover:text-primary"
            >
              {t("comunidad")}
            </Link>
            <Link
              href="/trayectoria"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-2 text-muted-foreground hover:bg-primary/5 hover:text-primary"
            >
              {t("trayectoria")}
            </Link>
            <Link
              href="/tienda"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-2 text-muted-foreground hover:bg-primary/5 hover:text-primary"
            >
              {t("tienda")}
            </Link>
            <Link
              href="/cosmeticos"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-2 text-muted-foreground hover:bg-primary/5 hover:text-primary"
            >
              {t("cosmeticos")}
            </Link>
            <Link
              href="/equipo"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-2 text-muted-foreground hover:bg-primary/5 hover:text-primary"
            >
              {t("equipo")}
            </Link>

            {user ? (
              <div className="pt-2 border-t border-primary/10 space-y-3">
                <Link
                  href={
                    user.username
                      ? `/perfil/${user.username}`
                      : "/onboarding/username"
                  }
                  className="flex min-h-11 items-center rounded-lg px-2 text-primary font-medium hover:bg-primary/5"
                  onClick={() => setMobileOpen(false)}
                >
                  {tUser("miPerfil")}
                </Link>
                <Link
                  href="/amigos"
                  className="flex min-h-11 items-center rounded-lg px-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("amigos")}
                </Link>
                <Link
                  href="/mensajes"
                  className="flex min-h-11 items-center rounded-lg px-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("mensajes")}
                </Link>
                {(user.role === "ADMIN" || user.role === "MOD") && (
                  <Link
                    href="/admin"
                    className="flex min-h-11 items-center rounded-lg px-2 text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {tUser("panelAdmin")}
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="flex min-h-11 w-full items-center rounded-lg px-2 text-left text-red-700 hover:bg-destructive/10 dark:text-red-400"
                >
                  {tUser("cerrarSesion")}
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-primary/10">
                <Link
                  href="/login"
                  className="flex min-h-11 items-center rounded-lg px-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
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
