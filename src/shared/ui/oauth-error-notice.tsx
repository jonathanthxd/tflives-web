"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useInitialClientValue } from "@/shared/lib/client-value";

export default function OAuthErrorNotice() {
  const t = useTranslations("OAuthError");
  const locale = useLocale();
  const initialVisible = useInitialClientValue(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get("error") === "account_not_linked" && !/\/(es|en)\/login\/?$/.test(url.pathname);
  }, false);
  const [dismissed, setDismissed] = useState(false);
  const visible = initialVisible && !dismissed;

  useEffect(() => {
    const url = new URL(window.location.href);
    const error = url.searchParams.get("error");

    if (error !== "account_not_linked") return;

    url.searchParams.delete("error");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  }, []);

  if (!visible) return null;

  const redirect = encodeURIComponent("/configuracion#security");

  return (
    <aside
      role="alert"
      aria-live="assertive"
      className="tfl-glass tfl-glass-strong fixed inset-x-4 top-20 z-[90] mx-auto max-w-2xl rounded-2xl border border-amber-400/25 p-4 sm:top-24 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
          <ShieldAlert className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold text-foreground">{t("accountNotLinkedTitle")}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("accountNotLinkedBody")}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`/${locale}/login?redirect=${redirect}`}
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {t("signInAndLink")}
            </a>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-xs font-semibold uppercase tracking-widest text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {t("dismiss")}
            </button>
          </div>
        </div>

        <button
          type="button"
          aria-label={t("dismiss")}
          onClick={() => setDismissed(true)}
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
