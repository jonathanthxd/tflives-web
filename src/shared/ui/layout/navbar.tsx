"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTheme } from "next-themes";
import { authClient } from "@/infrastructure/auth/client";
import AuthHeader from "@/shared/ui/layout/auth-header";
import UserMenu from "@/shared/ui/layout/user-menu";
import NotificationBell from "@/modules/notifications/components/notification-bell";
import NotificationToasts from "@/modules/notifications/components/notification-toasts";
import GlobalChat from "@/modules/chat/components/global-chat";
import MessagingUnreadLink from "@/modules/messaging/components/messaging-unread-link";

const MINIMAL_HEADER_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/two-factor",
  "/verify-email",
];

function NavPlaceholderLink({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className={`relative text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300 tracking-wide py-1 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-primary/70 after:transition-all after:duration-300 hover:after:w-full whitespace-nowrap ${className}`}
    >
      {label}
    </a>
  );
}

export default function Navbar() {
  const t = useTranslations("Navbar");
  const tUser = useTranslations("UserMenu");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isAuthRoute = MINIMAL_HEADER_ROUTES.includes(pathname);

  // resolvedTheme (y no theme) porque ThemeProvider usa enableSystem: con
  // theme === "system" la comparación contra "dark" daría un click sin efecto.
  const { resolvedTheme, setTheme } = useTheme();
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-xl border-b border-primary/10 shadow-lg shadow-black/5" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Theme toggle + locale switch (flex-1 para que ocupe espacio) */}
          <div className="flex-1 flex items-center justify-start gap-1">
            <button
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label={t("cambiarTema")}
              title={t("cambiarTema")}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
              </svg>
            </button>
            <Link
              href={pathname}
              locale={locale === "es" ? "en" : "es"}
              className="px-2 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 uppercase"
            >
              {locale === "es" ? "EN" : "ES"}
            </Link>
          </div>

          {/* Center: Logo + Links (centrado absoluto) */}
          <div className="flex items-center gap-3 sm:gap-5 md:gap-7 flex-shrink-0">
            <NavPlaceholderLink
              label={t("streamers")}
              className="hidden lg:inline-flex"
            />
            <Link
              href="/comunidad"
              className="hidden md:inline-flex text-sm text-muted-foreground hover:text-primary"
            >
              {t("comunidad")}
            </Link>

            <Link
              href="/network"
              className="relative text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300 tracking-wide py-1 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-primary/70 after:transition-all after:duration-300 hover:after:w-full whitespace-nowrap"
            >
              {t("network")}
            </Link>

            <Link href="/" className="flex flex-col items-center group">
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
              className="hidden md:inline-flex text-sm text-muted-foreground hover:text-primary"
            >
              {t("trayectoria")}
            </Link>
            <Link
              href="/tienda"
              className="hidden lg:inline-flex text-sm text-muted-foreground hover:text-primary"
            >
              {t("tienda")}
            </Link>
            <Link
              href="/equipo"
              className="hidden lg:inline-flex text-sm text-muted-foreground hover:text-primary"
            >
              {t("equipo")}
            </Link>
          </div>

          {/* Right: User / Login (flex-1 para que ocupe espacio) */}
          <div className="flex-1 flex items-center justify-end">
            {user ? (
              <div className="flex items-center gap-1 md:gap-2 ml-4 md:ml-8 lg:ml-12">
                <NotificationBell userId={user.id} />
                <NotificationToasts />
                <MessagingUnreadLink />
                <Link
                  href="/mensajes"
                  title={t("mensajes")}
                  className="hidden"
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
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                    />
                  </svg>
                </Link>
                <Link
                  href="/amigos"
                  title={t("amigos")}
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 hidden md:inline-flex"
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
                className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-muted-foreground border border-muted-foreground/20 rounded-full hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all duration-300 backdrop-blur-sm whitespace-nowrap"
              >
                {t("login")}
              </Link>
            )}

            {user && <GlobalChat userId={user.id} />}

            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? t("cerrarMenu") : t("abrirMenu")}
              className="ml-1 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 md:hidden"
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
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-background/95 backdrop-blur-xl border-b border-primary/10 shadow-inner">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/"
              className="block py-2 text-primary font-medium"
              onClick={() => setMobileOpen(false)}
            >
              TFLives
            </Link>
            <Link
              href="/network"
              className="block py-2 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {t("network")}
            </Link>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="block py-2 text-muted-foreground hover:text-primary transition-colors"
            >
              {t("streamers")}
            </a>
            <Link
              href="/comunidad"
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-muted-foreground hover:text-primary"
            >
              {t("comunidad")}
            </Link>
            <Link
              href="/trayectoria"
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-muted-foreground hover:text-primary"
            >
              {t("trayectoria")}
            </Link>
            <Link
              href="/tienda"
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-muted-foreground hover:text-primary"
            >
              {t("tienda")}
            </Link>
            <Link
              href="/equipo"
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-muted-foreground hover:text-primary"
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
                  className="block py-2 text-primary font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  {tUser("miPerfil")}
                </Link>
                <Link
                  href="/amigos"
                  className="block py-2 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("amigos")}
                </Link>
                <Link
                  href="/mensajes"
                  className="block py-2 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("mensajes")}
                </Link>
                {(user.role === "ADMIN" || user.role === "MOD") && (
                  <Link
                    href="/admin"
                    className="block py-2 text-foreground hover:text-primary transition-colors"
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
                  className="block w-full text-left py-2 text-red-700 dark:text-red-400"
                >
                  {tUser("cerrarSesion")}
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-primary/10">
                <Link
                  href="/login"
                  className="block py-2 text-muted-foreground hover:text-primary transition-colors"
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
