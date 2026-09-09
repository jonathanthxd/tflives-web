"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { authClient } from "@/infrastructure/auth/client";
import { registerSchema } from "@/modules/authentication/validation";
import { flattenZodErrors } from "@/shared/validation/zod-helpers";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormField } from "@/shared/ui/form-field";
import { OAuthButtons } from "@/modules/authentication/components/oauth-buttons";
import HeroGlow from "@/shared/ui/effects/hero-glow";

export default function RegisterPage() {
  const t = useTranslations("Register");
  const tAuth = useTranslations("Auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordValue, setPasswordValue] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [registered, setRegistered] = useState(false);

  const passwordStrength = useMemo(() => {
    let strength = 0;
    if (passwordValue.length >= 8) strength++;
    if (/[A-Z]/.test(passwordValue)) strength++;
    if (/[0-9]/.test(passwordValue)) strength++;
    if (/[^A-Za-z0-9]/.test(passwordValue)) strength++;
    return strength;
  }, [passwordValue]);

  const strengthLabels = [
    t("fuerzaMuyDebil"),
    t("fuerzaDebil"),
    t("fuerzaMedia"),
    t("fuerzaFuerte"),
    t("fuerzaMuyFuerte"),
  ];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];

  async function handleUsernameBlur(username: string) {
    if (!username || username.length < 3) return;
    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
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
      setFieldErrors((prev) => ({ ...prev, username: t("usernameEnUso") }));
      return;
    }

    setLoading(true);
    try {
      const displayName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

      const { error } = await authClient.signUp.email({
        name: displayName,
        email: parsed.data.email,
        password: parsed.data.password,
        callbackURL: "/onboarding/username",
      });

      if (error) {
        const code = error.code?.toUpperCase() || "";
        if (code.includes("USER_ALREADY_EXISTS") || code.includes("EMAIL")) {
          setFormError(t("emailRegistrado"));
        } else {
          setFormError(error.message || t("credencialesEnUso"));
        }
        return;
      }

      // Si Better Auth creó una sesión (configuración local/predeterminada),
      // terminamos el perfil de inmediato. Si la verificación de email está
      // activada, este PATCH devolverá 401 y mostramos la pantalla de correo.
      const profileRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: parsed.data.username,
          displayName,
        }),
      });

      if (profileRes.ok) {
        router.push(`/perfil/${parsed.data.username}`);
        router.refresh();
        return;
      }

      if (profileRes.status !== 401) {
        const profileData = await profileRes.json().catch(() => ({}));
        setFormError(profileData.error || t("credencialesEnUso"));
        return;
      }

      setRegistered(true);
    } catch {
      setFormError(tAuth("conexionError"));
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <main className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden">
        <HeroGlow />
        <div className="w-full max-w-md text-center">
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-glow-pulse" />
            <svg
              className="relative h-10 w-10 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            <svg
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary p-1 text-primary-foreground shadow-[0_4px_12px_hsl(var(--primary)/0.5)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">{t("revisaTuEmail")}</h1>
          <p className="text-foreground/70 mb-8">
            {t("emailEnviado")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/50 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-foreground transition-all duration-200 hover:-translate-y-px hover:border-primary/40 hover:text-primary"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0-1.036.84-1.875 1.875-1.875h15.75c1.035 0 1.875.84 1.875 1.875v10.5A1.875 1.875 0 0119.875 19.125H4.125A1.875 1.875 0 012.25 17.25V6.75zM3.622 6.44l7.803 5.457a1.125 1.125 0 001.25 0l7.803-5.457" />
              </svg>
              {t("abrirEmail")}
            </a>
            <Button variant="outline" onClick={() => router.push("/login")}>
              {t("irAIniciarSesion")}
            </Button>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            {t("noLlegoNada")}{" "}
            <button
              type="button"
              onClick={() => setRegistered(false)}
              className="text-primary hover:underline"
            >
              {t("probarOtroEmail")}
            </button>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center pt-28 pb-20 px-4 overflow-hidden">
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

        <OAuthButtons redirectTo="/onboarding/username" />

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest">{tAuth("oCorreo")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("nombre")} htmlFor="firstName" error={fieldErrors.firstName}>
              <Input id="firstName" name="firstName" type="text" placeholder="Jonathan" aria-invalid={!!fieldErrors.firstName} />
            </FormField>
            <FormField label={t("apellido")} htmlFor="lastName" error={fieldErrors.lastName}>
              <Input id="lastName" name="lastName" type="text" placeholder="Thompson" aria-invalid={!!fieldErrors.lastName} />
            </FormField>
          </div>

          <FormField label={t("username")} htmlFor="username" error={fieldErrors.username}>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="jonathanthxd"
              aria-invalid={!!fieldErrors.username}
              onBlur={(e) => handleUsernameBlur(e.target.value.toLowerCase())}
              onChange={() => {
                setUsernameTaken(false);
                setUsernameAvailable(false);
                setFieldErrors((prev) => ({ ...prev, username: "" }));
              }}
            />
            {checkingUsername && (
              <p className="mt-1.5 text-xs text-muted-foreground">{t("verificandoDisponibilidad")}</p>
            )}
            {!checkingUsername && usernameAvailable && !fieldErrors.username && (
              <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">{t("usernameDisponible")}</p>
            )}
          </FormField>

          <FormField label={tAuth("email")} htmlFor="email" error={fieldErrors.email}>
            <Input id="email" name="email" type="email" placeholder={tAuth("emailPlaceholder")} aria-invalid={!!fieldErrors.email} />
          </FormField>

          <FormField label={tAuth("password")} htmlFor="password" error={fieldErrors.password}>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={tAuth("passwordPlaceholder")}
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

          <FormField label={t("confirmarContrasena")} htmlFor="confirmPassword" error={fieldErrors.confirmPassword}>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder={tAuth("passwordPlaceholder")}
              aria-invalid={!!fieldErrors.confirmPassword}
            />
          </FormField>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("creandoCuenta") : t("crearCuentaBoton")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("yaTenesCuenta")}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t("iniciarSesion")}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
