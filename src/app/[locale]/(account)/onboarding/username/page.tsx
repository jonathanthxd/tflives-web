"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { usernameSchema } from "@/modules/authentication/validation";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormField } from "@/shared/ui/form-field";

export default function UsernameOnboardingPage() {
  const t = useTranslations("Onboarding");
  const tAuth = useTranslations("Auth");
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/me");
      const data = await res.json();

      if (!data.user) {
        router.replace("/login?redirect=/onboarding/username");
        return;
      }

      if (data.user.username) {
        router.replace(`/perfil/${data.user.username}`);
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
      setUsernameAvailable(!!data.available);
      if (!data.available && data.error) {
        setFieldErrors((prev) => ({ ...prev, username: data.error }));
      } else {
        setFieldErrors((prev) => ({ ...prev, username: "" }));
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
      setFieldErrors((prev) => ({ ...prev, username: t("usernameEnUso") }));
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
        setFormError(data.error || t("errorGuardar"));
        return;
      }

      router.replace(`/perfil/${parsed.data}`);
      router.refresh();
    } catch {
      setFormError(tAuth("conexionError"));
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
            {t("titulo")}
          </h1>
          <p className="text-muted-foreground">
            {t("subtitulo")}
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
          <FormField label={t("username")} htmlFor="username" error={fieldErrors.username}>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="jonathanthxd"
              autoFocus
              aria-invalid={!!fieldErrors.username}
              onBlur={(e) => handleUsernameBlur(e.target.value.toLowerCase())}
              onChange={() => {
                setUsernameTaken(false);
                setUsernameAvailable(false);
                setFieldErrors((prev) => ({ ...prev, username: "" }));
              }}
            />
            {checkingUsername && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("verificandoDisponibilidad")}
              </p>
            )}
            {!checkingUsername && usernameAvailable && !fieldErrors.username && (
              <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                {t("usernameDisponible")}
              </p>
            )}
          </FormField>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("guardando") : t("continuar")}
          </Button>
        </form>
      </div>
    </main>
  );
}
