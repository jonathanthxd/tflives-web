"use client";

import { useSyncExternalStore } from "react";
import { Cookie } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const STORAGE_KEY = "tfl-cookie-notice";
const EVENT_NAME = "tfl-cookie-notice-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(EVENT_NAME, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(EVENT_NAME, onStoreChange);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "dismissed";
  } catch {
    return true;
  }
}

function getServerSnapshot() {
  return false;
}

export default function CookieNotice() {
  const t = useTranslations("CookieNotice");
  const pathname = usePathname();
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isMessagingRoute =
    pathname === "/mensajes" || pathname.startsWith("/mensajes/");

  if (!visible || isAdminRoute || isMessagingRoute) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      /* Storage may be unavailable; the notice simply reappears next visit. */
    }
    window.dispatchEvent(new Event(EVENT_NAME));
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 sm:pb-4">
      <div
        role="region"
        aria-label={t("policy")}
        className="tfl-glass pointer-events-auto mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-border p-4 text-sm text-muted-foreground shadow-lg sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="flex items-start gap-3 leading-relaxed">
          <Cookie className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            {t("message")}{" "}
            <Link href="/cookies" className="text-primary underline-offset-2 hover:underline">
              {t("policy")}
            </Link>
            .
          </span>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="min-h-11 shrink-0 self-end rounded-full border border-primary/40 bg-primary/10 px-5 text-xs font-semibold uppercase tracking-widest text-primary transition-colors hover:bg-primary/20 sm:self-auto"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
