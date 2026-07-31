"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface UserMenuProps {
  displayName: string;
  username: string | null;
  role: string;
  image: string | null;
  onLogout: () => void;
}

export default function UserMenu({ displayName, username, role, image, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const profileHref = username ? `/perfil/${username}` : "/onboarding/username";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs md:text-sm font-medium hover:bg-primary/20 transition-all"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={displayName || "User"} className="w-5 h-5 md:w-6 md:h-6 rounded-full object-cover" />
        ) : (
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] md:text-xs font-bold">
            {(displayName[0] || "U").toUpperCase()}
          </div>
        )}
        <span className="max-w-[80px] md:max-w-[140px] truncate" title={displayName}>
          {displayName}
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-xl shadow-black/10 p-1.5 z-50 origin-top-right animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150"
        >
          <Link
            href={profileHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Mi perfil
          </Link>

          <button
            disabled
            title="Próximamente"
            aria-disabled="true"
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground/50 cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-16.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            Amigos
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 bg-muted rounded-full px-1.5 py-0.5">
              Pronto
            </span>
          </button>

          <button
            disabled
            title="Próximamente"
            aria-disabled="true"
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground/50 cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25v-1.5a2.25 2.25 0 012.25-2.25h7.5a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-1.5m-9-9h-1.5a2.25 2.25 0 00-2.25 2.25v7.5A2.25 2.25 0 007.5 18.75h7.5a2.25 2.25 0 002.25-2.25v-1.5m-9-9h9m-9 9h9" />
            </svg>
            Suscripción
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 bg-muted rounded-full px-1.5 py-0.5">
              Pronto
            </span>
          </button>

          {role === "ADMIN" && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Panel Admin
            </Link>
          )}

          <div className="my-1 h-px bg-border" />

          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            role="menuitem"
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-700 dark:text-red-400 hover:bg-destructive/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
