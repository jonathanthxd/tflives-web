"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/infrastructure/auth/client";
import { forgotPasswordSchema } from "@/modules/authentication/validation";
import { flattenZodErrors } from "@/shared/validation/zod-helpers";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormField } from "@/shared/ui/form-field";
import HeroGlow from "@/shared/ui/effects/hero-glow";

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPassword");
  const tAuth = useTranslations("Auth");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const raw = { email: formData.get("email") as string };

    const parsed = forgotPasswordSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(flattenZodErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email: parsed.data.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      setSent(true);
    } catch {
      setFormError(tAuth("conexionError"));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">{t("revisaTuEmail")}</h1>
          <p className="text-muted-foreground">
            {t("emailEnviado")}
          </p>
        </div>
      </main>
    );
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

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormField label={tAuth("email")} htmlFor="email" error={fieldErrors.email}>
            <Input id="email" name="email" type="email" placeholder={tAuth("emailPlaceholder")} aria-invalid={!!fieldErrors.email} />
          </FormField>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("enviando") : t("enviarLink")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              {t("volverAIniciarSesion")}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
