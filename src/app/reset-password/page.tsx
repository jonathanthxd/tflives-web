"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, flattenZodErrors } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import HeroGlow from "@/components/effects/hero-glow";

export default function ResetPasswordPage() {
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
      setFormError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden">
      <HeroGlow />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Nueva contraseña</h1>
          <p className="text-foreground/70">Elegí una contraseña nueva para tu cuenta</p>
        </div>

        {formError && (
          <div role="alert" className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormField label="Nueva contraseña" htmlFor="password" error={fieldErrors.password}>
            <Input id="password" name="password" type="password" placeholder="••••••••" aria-invalid={!!fieldErrors.password} />
          </FormField>

          <FormField label="Confirmar contraseña" htmlFor="confirmPassword" error={fieldErrors.confirmPassword}>
            <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" aria-invalid={!!fieldErrors.confirmPassword} />
          </FormField>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </form>
      </div>
    </main>
  );
}
