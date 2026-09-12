"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { authClient } from "@/infrastructure/auth/client";
import { loginSchema } from "@/modules/authentication/validation";
import { flattenZodErrors } from "@/shared/validation/zod-helpers";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormField } from "@/shared/ui/form-field";
import { OAuthButtons } from "@/modules/authentication/components/oauth-buttons";
import HeroGlow from "@/shared/ui/effects/hero-glow";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const t = useTranslations("Login");
  const tAuth = useTranslations("Auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitRedirect = searchParams.get("redirect");
  const redirectTo = explicitRedirect || "/onboarding/username";

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (searchParams.get("error") === "account_not_linked") {
      setFormError(t("accountNotLinked"));
    } else if (searchParams.get("oauthError")) {
      setFormError(t("oauthError"));
    }
  }, [searchParams, t]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const raw = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(flattenZodErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.signIn.email(parsed.data);

      if (error) {
        const code = error.code?.toUpperCase() || "";
        if (code.includes("EMAIL_NOT_VERIFIED")) {
          setFormError(t("emailNoConfirmado"));
        } else if (
          code.includes("INVALID") ||
          code.includes("CREDENTIAL") ||
          code.includes("PASSWORD")
        ) {
          setFormError(t("credencialesInvalidas"));
        } else {
          setFormError(error.message || t("credencialesInvalidas"));
        }
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setFormError(tAuth("conexionError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden">
      <HeroGlow />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">{t("titulo")}</h1>
          <p className="text-foreground/70">{t("subtitulo")}</p>
        </div>

        {formError && (
          <div role="alert" className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
            {formError}
          </div>
        )}

        <OAuthButtons redirectTo={redirectTo} />

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest">{tAuth("oCorreo")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormField label={tAuth("email")} htmlFor="email" error={fieldErrors.email}>
            <Input id="email" name="email" type="email" placeholder={tAuth("emailPlaceholder")} aria-invalid={!!fieldErrors.email} />
          </FormField>

          <FormField label={tAuth("password")} htmlFor="password" error={fieldErrors.password}>
            <Input id="password" name="password" type="password" placeholder={tAuth("passwordPlaceholder")} aria-invalid={!!fieldErrors.password} />
            <div className="text-right mt-1.5">
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                {t("olvidasteContrasena")}
              </Link>
            </div>
          </FormField>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("entrando") : t("entrar")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("noTenesCuenta")}{" "}
            <Link href="/register" className="text-primary hover:underline">
              {t("crearCuenta")}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
