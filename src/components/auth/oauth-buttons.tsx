"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Provider = "google" | "discord";

export function OAuthButtons({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  async function handleOAuth(provider: Provider) {
    setError("");
    setLoadingProvider(provider);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setError(`No se pudo iniciar con ${provider === "google" ? "Google" : "Discord"}. Probá de nuevo.`);
      setLoadingProvider(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={loadingProvider !== null}
          onClick={() => handleOAuth("google")}
          className="gap-2 normal-case tracking-normal text-sm"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0012 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09A6.6 6.6 0 015.5 12c0-.73.13-1.43.34-2.09V7.06H2.18A11 11 0 001 12c0 1.77.42 3.45 1.18 4.94l3.66-2.85z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"
            />
          </svg>
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={loadingProvider !== null}
          onClick={() => handleOAuth("discord")}
          className="gap-2 normal-case tracking-normal text-sm"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
            <path d="M20.32 5.36A19.8 19.8 0 0015.3 3.6a.08.08 0 00-.08.04c-.35.62-.74 1.43-1.01 2.06a18.3 18.3 0 00-5.42 0 13 13 0 00-1.03-2.06.08.08 0 00-.08-.04 19.7 19.7 0 00-5.02 1.76.07.07 0 00-.03.03C.9 9.6.2 13.7.55 17.75a.08.08 0 00.03.06 20 20 0 005.99 3.03.08.08 0 00.09-.03c.46-.63.87-1.3 1.23-2a.08.08 0 00-.04-.11 13 13 0 01-1.86-.89.08.08 0 01-.01-.13c.12-.1.25-.2.37-.3a.08.08 0 01.08-.01 14.2 14.2 0 0012.1 0 .08.08 0 01.08.01c.12.1.24.2.37.3a.08.08 0 010 .13c-.6.35-1.22.65-1.87.89a.08.08 0 00-.04.12c.37.7.78 1.37 1.23 2a.08.08 0 00.09.03 19.9 19.9 0 006-3.03.08.08 0 00.03-.06c.42-4.7-.7-8.76-2.95-12.36a.06.06 0 00-.03-.03zM8.68 15.32c-1 0-1.82-.92-1.82-2.04 0-1.12.8-2.04 1.82-2.04s1.84.93 1.82 2.04c0 1.12-.8 2.04-1.82 2.04zm6.65 0c-1 0-1.82-.92-1.82-2.04 0-1.12.8-2.04 1.82-2.04s1.84.93 1.82 2.04c0 1.12-.8 2.04-1.82 2.04z" />
          </svg>
          Discord
        </Button>
      </div>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </div>
  );
}
