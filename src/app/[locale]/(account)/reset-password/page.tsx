"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/infrastructure/auth/client";
import { resetPasswordSchema } from "@/modules/authentication/validation";
import { flattenZodErrors } from "@/shared/validation/zod-helpers";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormField } from "@/shared/ui/form-field";
import HeroGlow from "@/shared/ui/effects/hero-glow";

export default function ResetPasswordPage() {
  const t = useTranslations("ResetPassword");
  const tAuth = useTranslations("Auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const raw = {
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const parsed = resetPasswordSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(flattenZodErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

      if (error) {
        setFormError(error.message);
        return;
      }

      // updateUser deja al usuario logueado con la sesión de recuperación —
      // mandarlo a /login lo dejaría autenticado en una pantalla de login.
      router.push("/onboarding/username");
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

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormField label={t("nuevaContrasena")} htmlFor="password" error={fieldErrors.password}>
            <Input id="password" name="password" type="password" placeholder={tAuth("passwordPlaceholder")} aria-invalid={!!fieldErrors.password} />
          </FormField>

          <FormField label={t("confirmarContrasena")} htmlFor="confirmPassword" error={fieldErrors.confirmPassword}>
            <Input id="confirmPassword" name="confirmPassword" type="password" placeholder={tAuth("passwordPlaceholder")} aria-invalid={!!fieldErrors.confirmPassword} />
          </FormField>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("guardando") : t("guardarContrasena")}
          </Button>
        </form>
      </div>
    </main>
  );
}
