"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, flattenZodErrors } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import HeroGlow from "@/components/effects/hero-glow";

export default function ForgotPasswordPage() {
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
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      setSent(true);
    } catch {
      setFormError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">Revisá tu email</h1>
          <p className="text-muted-foreground">
            Si existe una cuenta con ese email, te enviamos un link para restablecer tu contraseña.
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
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Recuperar contraseña</h1>
          <p className="text-foreground/70">Te mandamos un link para crear una nueva</p>
        </div>

        {formError && (
          <div role="alert" className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormField label="Email" htmlFor="email" error={fieldErrors.email}>
            <Input id="email" name="email" type="email" placeholder="tu@email.com" aria-invalid={!!fieldErrors.email} />
          </FormField>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Enviando..." : "Enviar link"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
