"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import AuthHeader from "@/components/layout/auth-header";
import UserMenu from "@/components/layout/user-menu";

const MINIMAL_HEADER_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function Navbar() {
  const pathname = usePathname();
  const isAuthRoute = MINIMAL_HEADER_ROUTES.includes(pathname);

  // resolvedTheme (y no theme) porque ThemeProvider usa enableSystem: con
  // theme === "system" la comparación contra "dark" daría un click sin efecto.
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{
    name: string | null;
    username: string | null;
    role: string;
    image: string | null;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (data.user) {
        setUser({
          name: data.user.displayName || data.user.name || null,
          username: data.user.username || null,
          role: data.user.role,
          image: data.user.image || null,
        });
      } else {
        setUser(null);
      }
    }

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
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
          {/* Left: Theme toggle (flex-1 para que ocupe espacio) */}
          <div className="flex-1 flex items-center justify-start">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Cambiar tema"
              title="Cambiar tema"
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
          </div>

          {/* Center: Logo + Links (centrado absoluto) */}
          <div className="flex items-center gap-4 sm:gap-6 md:gap-8 flex-shrink-0">
            <Link
              href="/tienda"
              className="relative text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300 tracking-wide py-1 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-primary/70 after:transition-all after:duration-300 hover:after:w-full whitespace-nowrap"
            >
              Tienda
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
              href="/network"
              className="relative text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300 tracking-wide py-1 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-primary/70 after:transition-all after:duration-300 hover:after:w-full whitespace-nowrap"
            >
              TFL Network
            </Link>
          </div>

          {/* Right: User / Login (flex-1 para que ocupe espacio) */}
          <div className="flex-1 flex items-center justify-end">
            {user ? (
              <div className="flex items-center gap-1 md:gap-2">
                <button
                  disabled
                  title="Notificaciones (próximamente)"
                  aria-disabled="true"
                  className="p-2 rounded-lg text-muted-foreground/40 cursor-not-allowed hidden sm:inline-flex"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </button>
                <button
                  disabled
                  title="Mensajes (próximamente)"
                  aria-disabled="true"
                  className="p-2 rounded-lg text-muted-foreground/40 cursor-not-allowed hidden sm:inline-flex"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </button>
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
                Login
              </Link>
            )}
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
              href="/tienda"
              className="block py-2 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Tienda
            </Link>
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
              TFL Network
            </Link>

            {user ? (
              <div className="pt-2 border-t border-primary/10 space-y-3">
                <Link
                  href={user.username ? `/perfil/${user.username}` : "/onboarding/username"}
                  className="block py-2 text-primary font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  Mi perfil
                </Link>
                <div className="flex items-center gap-2 py-1 text-muted-foreground/40 text-sm cursor-not-allowed" title="Próximamente">
                  Amigos
                  <span className="text-[10px] uppercase tracking-wide">Pronto</span>
                </div>
                <div className="flex items-center gap-2 py-1 text-muted-foreground/40 text-sm cursor-not-allowed" title="Próximamente">
                  Mensajes
                  <span className="text-[10px] uppercase tracking-wide">Pronto</span>
                </div>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="block py-2 text-foreground hover:text-primary transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Panel Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="block w-full text-left py-2 text-red-700 dark:text-red-400"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-primary/10">
                <Link
                  href="/login"
                  className="block py-2 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}