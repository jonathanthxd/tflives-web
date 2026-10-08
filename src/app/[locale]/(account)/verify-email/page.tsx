"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "@/infrastructure/auth/client";
import { Card } from "@/shared/ui/card";

export default function VerifyEmailPage() {
  return <Suspense fallback={null}><VerifyEmailContent /></Suspense>;
}

function VerifyEmailContent() {
  const t = useTranslations("VerifyEmail");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationFailed, setError] = useState(false);
  const error = !searchParams.get("token") || verificationFailed;

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) return;
    void authClient.verifyEmail({ query: { token, callbackURL: "/onboarding/username" } }).then(({ error: verifyError }) => {
      if (verifyError) { setError(true); return; }
      router.replace("/onboarding/username");
      router.refresh();
    }).catch(() => setError(true));
  }, [router, searchParams]);

  return <main className="flex min-h-screen items-center justify-center px-4 pt-20"><Card className="w-full max-w-md p-6 text-center"><h1 className="font-display text-2xl font-bold">{error ? t("errorTitle") : t("title")}</h1><p className={`mt-3 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`} role={error ? "alert" : "status"}>{error ? t("errorDescription") : t("checking")}</p></Card></main>;
}
