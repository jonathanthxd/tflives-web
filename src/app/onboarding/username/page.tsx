"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usernameSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

export default function UsernameOnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/me");
      const data = await res.json();

      if (!data.user) {
        router.replace("/login?redirect=/onboarding/username");
        return;
      }

      if (data.user.username) {
        router.replace("/dashboard");
        return;
      }

      setChecking(false);
    }

    load();
  }, [router]);

  async function handleUsernameBlur(username: string) {
    if (!username || username.length < 3) return;
    setCheckingUsername(true);
    try {
      const res = await fetch(
        `/api/auth/check-username?username=${encodeURIComponent(username)}`
      );
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
    const username = ((formData.get("username") as string) || "").toLowerCase();

    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      // usernameSchema valida un string suelto: los issues no traen path,
      // así que mapeamos el mensaje al campo a mano.
      setFieldErrors({ username: parsed.error.issues[0].message });
      return;
    }

    if (usernameTaken) {
      setFieldErrors((prev) => ({ ...prev, username: "Este username ya está en uso" }));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: parsed.data }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || "No se pudo guardar el username");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setFormError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center pt-20 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Elegí tu username
          </h1>
          <p className="text-muted-foreground">
            Es el nombre con el que te van a encontrar en tu perfil público.
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormField label="Username" htmlFor="username" error={fieldErrors.username}>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="jonathanthxd"
              autoFocus
              aria-invalid={!!fieldErrors.username}
              onBlur={(e) => handleUsernameBlur(e.target.value.toLowerCase())}
              onChange={() => setUsernameTaken(false)}
            />
            {checkingUsername && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Verificando disponibilidad…
              </p>
            )}
          </FormField>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Guardando..." : "Continuar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
