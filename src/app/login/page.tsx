"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, flattenZodErrors } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import HeroGlow from "@/components/effects/hero-glow";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitRedirect = searchParams.get("redirect");
  const redirectTo = explicitRedirect || "/onboarding/username";

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(parsed.data);

      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setFormError("Email o contraseña incorrectos");
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          setFormError("Confirmá tu email antes de iniciar sesión — revisá tu bandeja de entrada.");
        } else {
          setFormError(error.message);
        }
        return;
      }

      router.push(redirectTo);
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
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Iniciar Sesión</h1>
          <p className="text-foreground/70">Accedé para seguir tu progreso y tu comunidad en TFLives</p>
        </div>

        {formError && (
          <div role="alert" className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
            {formError}
          </div>
        )}

        <OAuthButtons redirectTo={redirectTo} />

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest">o con email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormField label="Email" htmlFor="email" error={fieldErrors.email}>
            <Input id="email" name="email" type="email" placeholder="tu@email.com" aria-invalid={!!fieldErrors.email} />
          </FormField>

          <FormField label="Contraseña" htmlFor="password" error={fieldErrors.password}>
            <Input id="password" name="password" type="password" placeholder="••••••••" aria-invalid={!!fieldErrors.password} />
            <div className="text-right mt-1.5">
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </FormField>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Crear cuenta
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
