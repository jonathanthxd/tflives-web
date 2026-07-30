"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, flattenZodErrors } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordValue, setPasswordValue] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [registered, setRegistered] = useState(false);

  const passwordStrength = useMemo(() => {
    let strength = 0;
    if (passwordValue.length >= 8) strength++;
    if (/[A-Z]/.test(passwordValue)) strength++;
    if (/[0-9]/.test(passwordValue)) strength++;
    if (/[^A-Za-z0-9]/.test(passwordValue)) strength++;
    return strength;
  }, [passwordValue]);

  const strengthLabels = ["Muy débil", "Débil", "Media", "Fuerte", "Muy fuerte"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];

  async function handleUsernameBlur(username: string) {
    if (!username || username.length < 3) return;
    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setUsernameTaken(!data.available);
      if (!data.available && data.error) {
        setFieldErrors((prev) => ({ ...prev, username: data.error }));
      }
    } catch {
      // Si falla el chequeo, no bloqueamos — la unicidad la garantiza la DB igual.
    } finally {
      setCheckingUsername(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const raw = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      username: (formData.get("username") as string || "").toLowerCase(),
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(flattenZodErrors(parsed.error));
      return;
    }

    if (usernameTaken) {
      setFieldErrors((prev) => ({ ...prev, username: "Este username ya está en uso" }));
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const displayName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            username: parsed.data.username,
            display_name: displayName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("database")) {
          setFormError("Este username o email ya está en uso.");
        } else if (error.message.toLowerCase().includes("already registered")) {
          setFormError("Este email ya está registrado.");
        } else {
          setFormError(error.message);
        }
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Sin sesión = falta confirmar el email (configuración por defecto de Supabase Auth).
      setRegistered(true);
    } catch {
      setFormError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <main className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">Revisá tu email</h1>
          <p className="text-muted-foreground">
            Te enviamos un link de confirmación. Confirmá tu cuenta para poder iniciar sesión en TFLives.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center pt-28 pb-20 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Crear Cuenta</h1>
          <p className="text-muted-foreground">Únete a la comunidad TFLives</p>
        </div>

        {formError && (
          <div role="alert" className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
            {formError}
          </div>
        )}

        <OAuthButtons redirectTo="/dashboard" />

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest">o con email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre" htmlFor="firstName" error={fieldErrors.firstName}>
              <Input id="firstName" name="firstName" type="text" placeholder="Jonathan" aria-invalid={!!fieldErrors.firstName} />
            </FormField>
            <FormField label="Apellido" htmlFor="lastName" error={fieldErrors.lastName}>
              <Input id="lastName" name="lastName" type="text" placeholder="Thompson" aria-invalid={!!fieldErrors.lastName} />
            </FormField>
          </div>

          <FormField label="Username" htmlFor="username" error={fieldErrors.username}>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="jonathanthxd"
              aria-invalid={!!fieldErrors.username}
              onBlur={(e) => handleUsernameBlur(e.target.value.toLowerCase())}
              onChange={() => setUsernameTaken(false)}
            />
            {checkingUsername && <p className="mt-1.5 text-xs text-muted-foreground">Verificando disponibilidad…</p>}
          </FormField>

          <FormField label="Email" htmlFor="email" error={fieldErrors.email}>
            <Input id="email" name="email" type="email" placeholder="tu@email.com" aria-invalid={!!fieldErrors.email} />
          </FormField>

          <FormField label="Contraseña" htmlFor="password" error={fieldErrors.password}>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              aria-invalid={!!fieldErrors.password}
              onChange={(e) => setPasswordValue(e.target.value)}
            />
            <div className="mt-2">
              <div className="flex gap-1 h-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-300 ${
                      i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              {passwordStrength > 0 && (
                <p className={`text-xs mt-1 ${strengthColors[passwordStrength - 1].replace("bg-", "text-")}`}>
                  {strengthLabels[passwordStrength - 1]}
                </p>
              )}
            </div>
          </FormField>

          <FormField label="Confirmar Contraseña" htmlFor="confirmPassword" error={fieldErrors.confirmPassword}>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              aria-invalid={!!fieldErrors.confirmPassword}
            />
          </FormField>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
