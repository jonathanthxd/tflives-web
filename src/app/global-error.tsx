"use client";

import { useEffect } from "react";
import { sendClientError } from "@/shared/observability/client-error";

// This boundary replaces the root layout, so the next-intl provider is not
// available here. It locally resolves the locale from the document to keep the
// catastrophic-failure screen usable without coupling to server state.
function localeFromPathname(): "es" | "en" {
  if (typeof window === "undefined") return "en";
  const segment = window.location.pathname.split("/")[1];
  return segment === "es" || segment === "en" ? segment : "es";
}

const COPY = {
  es: { title: "Algo salió mal", description: "Hubo un error inesperado en la aplicación.", retry: "Intentar de nuevo" },
  en: { title: "Something went wrong", description: "An unexpected error occurred in the application.", retry: "Try again" },
} as const;

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const locale = localeFromPathname();

  useEffect(() => {
    sendClientError(String(error?.message || error?.digest || "Unknown global error"), "client:global");
  }, [error]);

  return (
    <html lang={locale}>
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground" role="alert">
          {COPY[locale].title}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">{COPY[locale].description}</p>
        <button
          onClick={retry}
          className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {COPY[locale].retry}
        </button>
      </body>
    </html>
  );
}