"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-xl border-b border-primary/10 shadow-lg shadow-black/5" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Theme toggle (flex-1 para que ocupe espacio) */}
          <div className="flex-1 flex items-center justify-start">
            <button className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300">
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
              <span className="font-display text-xl md:text-2xl lg:text-3xl font-bold tracking-tight transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(147,197,253,0.5)] whitespace-nowrap">
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
              <div className="flex items-center gap-2 md:gap-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs md:text-sm font-medium hover:bg-primary/20 transition-all"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={displayName || "User"}
                      className="w-5 h-5 md:w-6 md:h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] md:text-xs font-bold">
                      {(displayName[0] || "U").toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[80px] md:max-w-[140px] truncate" title={displayName}>
                    {displayName}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 md:p-2 text-muted-foreground hover:text-red-400 transition-colors"
                  title="Cerrar sesión"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
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
                  href="/dashboard"
                  className="block py-2 text-primary font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="block w-full text-left py-2 text-red-400"
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