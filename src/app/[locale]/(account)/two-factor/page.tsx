"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "@/infrastructure/auth/client";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

export default function TwoFactorPage() {
  return <Suspense fallback={null}><TwoFactorForm /></Suspense>;
}

function TwoFactorForm() {
  const t = useTranslations("TwoFactorChallenge");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = useRecovery
      ? await authClient.twoFactor.verifyBackupCode({ code })
      : await authClient.twoFactor.verifyTotp({ code });
    setLoading(false);
    if (result.error) {
      setError(t("invalidCode"));
      return;
    }
    router.replace("/onboarding/username");
    router.refresh();
  }

  return <main className="flex min-h-screen items-center justify-center px-4 pt-20"><Card className="w-full max-w-md p-6"><h1 className="font-display text-2xl font-bold">{t("title")}</h1><p className="mt-2 text-sm text-muted-foreground">{t(useRecovery ? "recoveryDescription" : "description")}</p>{error && <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<form className="mt-6 space-y-4" onSubmit={submit}><Input aria-label={t("code")} autoFocus autoComplete="one-time-code" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} required /><Button className="w-full" type="submit" disabled={loading}>{loading ? t("verifying") : t("verify")}</Button></form><button type="button" className="mt-5 text-sm text-primary underline-offset-4 hover:underline" onClick={() => { setUseRecovery((value) => !value); setCode(""); }}>{t(useRecovery ? "useAuthenticator" : "useRecovery")}</button></Card></main>;
}
