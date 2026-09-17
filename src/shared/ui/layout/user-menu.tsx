"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { UserAvatar } from "@/modules/profiles/components/user-identity";

interface UserMenuProps {
  displayName: string;
  username: string | null;
  role: string;
  image: string | null;
  onLogout: () => void;
  compact?: boolean;
}

export default function UserMenu({ displayName, username, role, image, onLogout, compact = false }: UserMenuProps) {
  const t = useTranslations("UserMenu");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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

  function focusMenuItem(direction: "first" | "last" | "next" | "previous") {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? []);
    if (!items.length) return;
    const current = document.activeElement as HTMLElement | null;
    const currentIndex = items.indexOf(current ?? items[0]);
    const target = direction === "first" ? items[0]
      : direction === "last" ? items.at(-1)
      : direction === "next" ? items[(currentIndex + 1) % items.length]
      : items[(currentIndex - 1 + items.length) % items.length];
    target?.focus();
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusMenuItem("first"));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusMenuItem("last"));
    }
  }

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      focusMenuItem("next");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusMenuItem("previous");
    } else if (event.key === "Home") {
      event.preventDefault();
      focusMenuItem("first");
    } else if (event.key === "End") {
      event.preventDefault();
      focusMenuItem("last");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="user-navigation-menu"
        aria-label={compact ? displayName || t("miPerfil") : undefined}
        className={`flex min-h-11 items-center text-primary text-xs font-medium transition-[padding,gap,border-radius,background-color,color] duration-300 hover:bg-primary/[0.08] md:text-sm ${
          compact
            ? "gap-0 rounded-full p-1"
            : "gap-1.5 rounded-xl px-2.5 md:gap-2 md:px-3"
        } ${open ? "bg-primary/[0.10]" : "bg-transparent"}`}
      >
        <UserAvatar
          identity={{ displayName, name: displayName, username, image }}
          className={`transition-[width,height,font-size,box-shadow] duration-300 ${
            compact
              ? "size-8 text-xs shadow-[0_0_0_1px_hsl(var(--primary)/0.25),0_0_18px_-8px_hsl(var(--primary)/0.8)]"
              : "size-5 text-[10px] md:size-6 md:text-xs"
          }`}
          alt={displayName || "User"}
        />
        <span
          className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ${
            compact ? "max-w-0 opacity-0" : "max-w-[80px] opacity-100 md:max-w-[140px]"
          }`}
          title={displayName}
          aria-hidden={compact}
        >
          {displayName}
        </span>
        <span
          className={`grid overflow-hidden transition-[width,opacity,transform] duration-300 ${
            compact ? "w-0 opacity-0" : "w-3.5 opacity-100"
          } ${open && !compact ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          id="user-navigation-menu"
          ref={menuRef}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className="tfl-glass tfl-glass-strong absolute right-0 z-50 mt-2 w-56 rounded-2xl border p-1.5 origin-top-right animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150"
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
            {t("miPerfil")}
          </Link>

          <Link
            href="/amigos"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-16.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            {t("amigos")}
          </Link>

          <Link
            href="/suscripcion"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25v-1.5a2.25 2.25 0 012.25-2.25h7.5a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-1.5m-9-9h-1.5a2.25 2.25 0 00-2.25 2.25v7.5A2.25 2.25 0 007.5 18.75h7.5a2.25 2.25 0 002.25-2.25v-1.5m-9-9h9m-9 9h9" />
            </svg>
            {t("suscripcion")}
          </Link>

          {(role === "ADMIN" || role === "MOD") && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              {t("panelAdmin")}
            </Link>
          )}

          <Link
            href="/configuracion"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t("configuracion")}
          </Link>

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
            {t("cerrarSesion")}
          </button>
        </div>
      )}
    </div>
  );
}
