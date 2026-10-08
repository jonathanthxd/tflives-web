"use client";

import { FormEvent, useEffect, useState } from "react";
import { useInitialClientValue } from "@/shared/lib/client-value";
import QRCode from "qrcode";
import { useLocale, useTranslations } from "next-intl";
import { authClient } from "@/infrastructure/auth/client";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import { formatUserDateTime } from "@/shared/lib/date-time";

type Provider = "google" | "discord";
type Account = { id: string; providerId: string; createdAt: string };
type Session = { id: string; createdAt: string; expiresAt: string; current: boolean; device: string | null };
type Event = { id: string; event: string; userAgent: string | null; createdAt: string };
type SecurityData = {
  email: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  hasPassword: boolean;
  accounts: Account[];
  sessions: Session[];
  events: Event[];
};
type ConfirmAction = { kind: "revoke-session"; sessionId: string } | { kind: "revoke-others" } | { kind: "unlink"; accountId: string } | null;

function authErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const candidate = error as { code?: unknown; message?: unknown; statusText?: unknown };
  const raw =
    typeof candidate.code === "string"
      ? candidate.code
      : typeof candidate.message === "string"
        ? candidate.message
        : typeof candidate.statusText === "string"
          ? candidate.statusText
          : "";

  return raw.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

const PROVIDERS: Provider[] = ["google", "discord"];
const EMPTY_OAUTH = { provider: null as string | null, error: false };

export function SecuritySettings() {
  const t = useTranslations("Security");
  const locale = useLocale();
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const initialOAuth = useInitialClientValue(() => {
    const url = new URL(window.location.href);
    const provider = url.searchParams.get("provider");
    return { provider, error: provider !== "google" && provider !== "discord" && Boolean(url.searchParams.get("oauthError")) };
  }, EMPTY_OAUTH);
  const [noticeOverride, setNotice] = useState<string | null>(null);
  const [errorOverride, setError] = useState<string | null>(null);
  const notice = noticeOverride ?? (initialOAuth.provider === "google" || initialOAuth.provider === "discord"
    ? t("providerLinked", { provider: initialOAuth.provider === "google" ? "Google" : "Discord" }) : "");
  const error = errorOverride ?? (initialOAuth.error ? t("providerActionFailed") : "");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [revokeOthers, setRevokeOthers] = useState(true);
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const load = () => fetch("/api/account/security", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error(await response.text());
      setData(await response.json());
    }).catch(() => setError(t("sessionRefreshRequired")))
    .finally(() => setLoading(false));

  useEffect(() => {
    void load();

    const url = new URL(window.location.href);
    const linkedProvider = url.searchParams.get("provider");
    const oauthError = url.searchParams.get("oauthError");

    if (linkedProvider === "google" || linkedProvider === "discord") {
      url.searchParams.delete("provider");
    } else if (oauthError) {
      url.searchParams.delete("oauthError");
    }

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);

    // load intentionally only runs once; actions explicitly refresh state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSuccess = (message: string) => {
    setError("");
    setNotice(message);
  };

  const twoFactorErrorMessage = (authError: unknown, fallback: string) => {
    const code = authErrorCode(authError);

    if (code.includes("INVALID_PASSWORD")) return t("twoFactorInvalidPassword");
    if (code.includes("TOTP_ALREADY_ENABLED")) return t("twoFactorAlreadyEnabled");
    if (code.includes("TOTP_NOT_CONFIGURED")) return t("twoFactorUnavailable");
    if (code.includes("TWO_FACTOR_NOT_ENABLED")) return t("twoFactorNotEnabled");
    if (code.includes("ACCOUNT_TEMPORARILY_LOCKED") || code.includes("TOO_MANY_ATTEMPTS")) {
      return t("twoFactorLocked");
    }
    if (code.includes("TOO_MANY_REQUESTS") || code.includes("RATE_LIMIT")) {
      return t("twoFactorRateLimited");
    }
    if (code.includes("UNAUTHORIZED") || code.includes("SESSION")) return t("sessionRefreshRequired");

    // Better Auth error codes are safe to expose and make support actionable;
    // credentials, tokens and provider secrets are never included here.
    return code ? `${fallback} (${code})` : fallback;
  };

  async function linkProvider(provider: Provider) {
    setBusy(`link-${provider}`);
    setError("");
    try {
      const callbackURL = `${window.location.pathname}?provider=${provider}`;
      const { error: linkError } = await authClient.linkSocial({
        provider,
        callbackURL,
        errorCallbackURL: `${window.location.pathname}?oauthError=1`,
      });
      if (linkError) setError(t("providerActionFailed"));
    } catch {
      setError(t("providerActionFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function resendVerification() {
    if (!data) return;
    setBusy("verify-email");
    setError("");
    const { error: resendError } = await authClient.sendVerificationEmail({
      email: data.email,
      callbackURL: `${window.location.origin}${window.location.pathname}`,
    });
    setBusy(null);
    if (resendError) setError(t("resendFailed"));
    else showSuccess(t("verificationSent"));
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data || newPassword.length < 8 || newPassword.length > 128) {
      setError(t("passwordPolicy"));
      return;
    }
    setBusy("password");
    setError("");
    const { error: passwordError } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: revokeOthers,
    });
    setBusy(null);
    if (passwordError) setError(t("passwordChangeFailed"));
    else {
      setCurrentPassword("");
      setNewPassword("");
      showSuccess(t("passwordChanged"));
      setLoading(true); void load();
    }
  }

  async function startTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (data?.hasPassword && !twoFactorPassword) {
      setError(t("currentPasswordRequired"));
      return;
    }
    setBusy("two-factor-enable");
    setError("");
    try {
      const { data: setup, error: setupError } = await authClient.twoFactor.enable({
        method: "totp",
        issuer: "TFLives",
        ...(data?.hasPassword ? { password: twoFactorPassword } : {}),
      });

      if (setupError || !setup) {
        setError(twoFactorErrorMessage(setupError, t("twoFactorSetupFailed")));
        return;
      }
      if (setup.method !== "totp" || !setup.totpURI || !setup.backupCodes) {
        setError(t("twoFactorUnexpectedResponse"));
        return;
      }

      const generatedQr = await QRCode.toDataURL(setup.totpURI, {
        width: 192,
        margin: 1,
        errorCorrectionLevel: "M",
      });
      setTotpUri(setup.totpURI);
      setBackupCodes(setup.backupCodes);
      setQrCode(generatedQr);
      setTwoFactorPassword("");
    } catch (setupException) {
      setError(twoFactorErrorMessage(setupException, t("twoFactorSetupFailed")));
    } finally {
      setBusy(null);
    }
  }

  async function verifyTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("two-factor-verify");
    setError("");
    const { error: verifyError } = await authClient.twoFactor.verifyTotp({ code: twoFactorCode });
    setBusy(null);
    if (verifyError) {
      setError(twoFactorErrorMessage(verifyError, t("twoFactorVerifyFailed")));
      return;
    }
    setTwoFactorCode("");
    showSuccess(t("twoFactorEnabled"));
    setLoading(true); void load();
  }

  async function regenerateCodes() {
    if (data?.hasPassword && !twoFactorPassword) {
      setError(t("currentPasswordRequired"));
      return;
    }
    setBusy("two-factor-regenerate");
    const { data: generated, error: generationError } = await authClient.twoFactor.generateBackupCodes(
      data?.hasPassword ? { password: twoFactorPassword } : {}
    );
    setBusy(null);
    if (generationError || !generated) {
      setError(twoFactorErrorMessage(generationError, t("twoFactorSetupFailed")));
    }
    else {
      setBackupCodes(generated.backupCodes);
      setTwoFactorPassword("");
      showSuccess(t("codesRegenerated"));
    }
  }

  async function performConfirmedAction() {
    if (!confirm) return;
    setBusy(confirm.kind);
    setError("");
    try {
      if (confirm.kind === "unlink") {
        const { error: unlinkError } = await authClient.unlinkAccount({ accountId: confirm.accountId });
        if (unlinkError) throw new Error();
        showSuccess(t("providerUnlinked"));
      } else {
        const body = confirm.kind === "revoke-session"
          ? { action: "revoke-session", sessionId: confirm.sessionId }
          : { action: "revoke-others" };
        const response = await fetch("/api/account/security", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (result.currentSession) {
          await authClient.signOut();
          window.location.assign(`/${locale}/login`);
          return;
        }
        showSuccess(confirm.kind === "revoke-others" ? t("otherSessionsRevoked") : t("sessionRevoked"));
      }
      setConfirm(null);
      setLoading(true); void load();
    } catch {
      setError(t("securityActionFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function disableTwoFactor() {
    if (data?.hasPassword && !twoFactorPassword) {
      setError(t("currentPasswordRequired"));
      return;
    }
    setBusy("two-factor-disable");
    const { error: disableError } = await authClient.twoFactor.disable(
      data?.hasPassword ? { password: twoFactorPassword } : {}
    );
    setBusy(null);
    if (disableError) setError(twoFactorErrorMessage(disableError, t("twoFactorSetupFailed")));
    else {
      setTwoFactorPassword("");
      setTotpUri(null);
      setQrCode(null);
      setBackupCodes([]);
      showSuccess(t("twoFactorDisabled"));
      setLoading(true); void load();
    }
  }

  const confirmationCopy = confirm?.kind === "unlink"
    ? { title: t("unlinkTitle"), description: t("unlinkDescription"), label: t("unlink") }
    : confirm?.kind === "revoke-others"
      ? { title: t("revokeOthersTitle"), description: t("revokeOthersDescription"), label: t("revoke") }
      : { title: t("revokeSessionTitle"), description: t("revokeSessionDescription"), label: t("revoke") };

  if (loading) {
    return <Card className="p-6"><p className="text-sm text-muted-foreground" role="status">{t("loading")}</p></Card>;
  }

  if (!data) {
    return <Card className="p-6"><p className="text-sm text-destructive" role="alert">{error || t("securityActionFailed")}</p></Card>;
  }

  return (
    <section className="space-y-6" aria-labelledby="security-heading">
      <div>
        <h2 id="security-heading" className="font-display text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {(notice || error) && (
        <p role={error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/20 bg-primary/10 text-foreground"}`}>
          {error || notice}
        </p>
      )}

      <Card className="p-6">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide">{t("emailVerification")}</h3>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm text-foreground">{data.email}</p><p className="text-xs text-muted-foreground">{data.emailVerified ? t("verified") : t("notVerified")}</p></div>
          {!data.emailVerified && <Button variant="outline" size="sm" disabled={busy === "verify-email"} onClick={() => void resendVerification()}>{t("resendVerification")}</Button>}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide">{t("accessMethods")}</h3>
        <div className="mt-4 space-y-3">
          <AccessMethod label={t("emailPassword")} detail={data.hasPassword ? t("connected") : t("notAvailable")} />
          {PROVIDERS.map((provider) => {
            const account = data.accounts.find((item) => item.providerId === provider);
            return <div key={provider} className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"><AccessMethod label={provider === "google" ? "Google" : "Discord"} detail={account ? t("connected") : t("notConnected")} />{account ? <Button variant="outline" size="sm" disabled={busy === "unlink"} onClick={() => setConfirm({ kind: "unlink", accountId: account.id })}>{t("unlink")}</Button> : <Button variant="outline" size="sm" disabled={busy === `link-${provider}`} onClick={() => void linkProvider(provider)}>{t("link")}</Button>}</div>;
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{t("linkingHint")}</p>
      </Card>

      {data.hasPassword && <Card className="p-6"><h3 className="font-display text-sm font-semibold uppercase tracking-wide">{t("password")}</h3><form className="mt-4 space-y-4" onSubmit={changePassword}><FormField label={t("currentPassword")} htmlFor="security-current-password"><Input id="security-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></FormField><FormField label={t("newPassword")} htmlFor="security-new-password"><Input id="security-new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></FormField><label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={revokeOthers} onChange={(event) => setRevokeOthers(event.target.checked)} />{t("revokeAfterPassword")}</label><Button type="submit" disabled={busy === "password"}>{t("changePassword")}</Button></form></Card>}

      <Card className="p-6">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide">{t("twoFactor")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{data.twoFactorEnabled ? t("twoFactorActive") : t("twoFactorInactive")}</p>
        {!data.twoFactorEnabled && !totpUri && <form className="mt-4 space-y-4" onSubmit={startTwoFactor}>{data.hasPassword && <FormField label={t("currentPassword")} htmlFor="two-factor-password"><Input id="two-factor-password" type="password" autoComplete="current-password" value={twoFactorPassword} onChange={(event) => setTwoFactorPassword(event.target.value)} required /></FormField>}<Button type="submit" disabled={busy === "two-factor-enable"}>{t("setupTwoFactor")}</Button></form>}
        {totpUri && <div className="mt-4 space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-sm font-medium">{t("scanQr")}</p>{qrCode && <img src={qrCode} width={192} height={192} alt={t("qrAlt")} className="rounded-lg bg-white p-2" />}<details><summary className="cursor-pointer text-sm text-primary">{t("manualKey")}</summary><p className="mt-2 break-all font-mono text-xs text-muted-foreground">{totpUri}</p></details><form className="flex flex-col gap-3 sm:flex-row" onSubmit={verifyTwoFactor}><Input aria-label={t("verificationCode")} inputMode="numeric" autoComplete="one-time-code" value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} required /><Button type="submit" disabled={busy === "two-factor-verify"}>{t("verifyAndEnable")}</Button></form></div>}
        {data.twoFactorEnabled && <div className="mt-4 space-y-4">{data.hasPassword && <FormField label={t("currentPassword")} htmlFor="two-factor-manage-password"><Input id="two-factor-manage-password" type="password" autoComplete="current-password" value={twoFactorPassword} onChange={(event) => setTwoFactorPassword(event.target.value)} /></FormField>}<div className="flex flex-wrap gap-3"><Button variant="outline" size="sm" disabled={busy === "two-factor-regenerate"} onClick={() => void regenerateCodes()}>{t("regenerateCodes")}</Button><Button variant="destructive" size="sm" disabled={busy === "two-factor-disable"} onClick={() => void disableTwoFactor()}>{t("disableTwoFactor")}</Button></div></div>}
        {backupCodes.length > 0 && <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"><p className="text-sm font-medium">{t("saveCodes")}</p><p className="mt-1 text-xs text-muted-foreground">{t("codesShownOnce")}</p><div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-3">{backupCodes.map((code) => <code key={code} className="rounded bg-background px-2 py-1.5">{code}</code>)}</div></div>}
      </Card>

      <Card className="p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-display text-sm font-semibold uppercase tracking-wide">{t("sessions")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("sessionsHint")}</p></div><Button variant="outline" size="sm" disabled={busy === "revoke-others"} onClick={() => setConfirm({ kind: "revoke-others" })}>{t("revokeOtherSessions")}</Button></div><div className="mt-4 divide-y divide-border">{data.sessions.map((session) => <div key={session.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{session.device || t("unknownDevice")} {session.current && <span className="ml-2 text-xs text-primary">{t("currentSession")}</span>}</p><p className="text-xs text-muted-foreground">{t("createdAt", { date: formatUserDateTime(session.createdAt, locale) })}</p></div><Button variant="outline" size="sm" disabled={busy === "revoke-session"} onClick={() => setConfirm({ kind: "revoke-session", sessionId: session.id })}>{session.current ? t("signOut") : t("revoke")}</Button></div>)}</div></Card>

      <Card className="p-6"><h3 className="font-display text-sm font-semibold uppercase tracking-wide">{t("activity")}</h3><div className="mt-4 divide-y divide-border">{data.events.length === 0 ? <p className="py-3 text-sm text-muted-foreground">{t("noActivity")}</p> : data.events.map((event) => <div key={event.id} className="py-3"><p className="text-sm font-medium">{t(`event.${event.event}`)}</p><p className="text-xs text-muted-foreground">{formatUserDateTime(event.createdAt, locale)}{event.userAgent ? ` · ${event.userAgent}` : ""}</p></div>)}</div></Card>

      <ConfirmDialog open={confirm !== null} title={confirmationCopy.title} description={confirmationCopy.description} confirmLabel={confirmationCopy.label} cancelLabel={t("cancel")} busy={busy === confirm?.kind} onConfirm={() => void performConfirmedAction()} onCancel={() => setConfirm(null)} />
    </section>
  );
}

function AccessMethod({ label, detail }: { label: string; detail: string }) {
  return <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{detail}</p></div>;
}
