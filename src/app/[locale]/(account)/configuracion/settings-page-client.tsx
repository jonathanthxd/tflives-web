"use client";

import { readJsonResponse } from "@/shared/lib/http";
import { useEffect, useState } from "react";
import { Bell, Coins, ShieldCheck, UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card } from "@/shared/ui/card";
import { NOTIFICATION_CATEGORIES } from "@/modules/notifications/categories";
import MySanctionsCard from "@/modules/administration/components/my-sanctions-card";
import { SecuritySettings } from "@/modules/authentication/components/security-settings";
import { ProfileSettings, type EditableProfile } from "@/modules/profiles/components/profile-settings";
import { WalletSettings } from "@/modules/economy/components/wallet-settings";

type Visibility = "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
type Section = "profile" | "security" | "privacy" | "notifications" | "wallet";

interface Preference {
  category: string;
  inAppEnabled: boolean;
  browserEnabled: boolean;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-11 w-12 shrink-0 items-center rounded-full border p-1 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        checked
          ? "border-primary/70 bg-primary"
          : "border-border bg-muted/80 hover:bg-muted"
      }`}
    >
      <span
        aria-hidden="true"
        className={`block size-5 shrink-0 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const tCompletion = useTranslations("Completion");
  const [loadFailed, setLoadFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const t = useTranslations("Settings");
  const tCategory = useTranslations("Settings.categoria");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>("security");
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash === "profile" || hash === "privacy" || hash === "notifications" || hash === "security" || hash === "wallet") {
      setSection(hash);
    }

    const onHashChange = () => {
      const next = window.location.hash.slice(1);
      if (next === "profile" || next === "privacy" || next === "notifications" || next === "security" || next === "wallet") {
        setSection(next);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    async function load() {
      setLoadFailed(false);
      try {
      const meRes = await fetch("/api/me");
      const me = await readJsonResponse(meRes);
      if (!me.user) {
        router.replace("/login?redirect=/configuracion");
        return;
      }

      setProfile(me.user as EditableProfile);

      const [privacyRes, prefsRes] = await Promise.all([
        fetch("/api/social/privacy"),
        fetch("/api/notifications/preferences"),
      ]);
      const privacy = await readJsonResponse(privacyRes);
      const prefs = await readJsonResponse(prefsRes);

      setAllowFriendRequests(privacy.allowFriendRequests ?? true);
      setVisibility(privacy.friendsListVisibility ?? "PUBLIC");
      setPreferences(prefs.preferences ?? []);
      setLoading(false);
      } catch { setLoadFailed(true); }
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  function selectSection(next: Section) {
    setSection(next);
    const url = new URL(window.location.href);
    url.hash = next;
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  async function updatePrivacy(partial: { allowFriendRequests?: boolean; friendsListVisibility?: Visibility }) {
    const previous = { allowFriendRequests, visibility };
    setError("");
    if (partial.allowFriendRequests !== undefined) setAllowFriendRequests(partial.allowFriendRequests);
    if (partial.friendsListVisibility !== undefined) setVisibility(partial.friendsListVisibility);
    try {
      const response = await fetch("/api/social/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (!response.ok) throw new Error("privacy");
    } catch {
      setAllowFriendRequests(previous.allowFriendRequests);
      setVisibility(previous.visibility);
      setError(t("saveError"));
    }
  }

  async function updatePreference(category: string, patch: Partial<Preference>) {
    const previous = preferences;
    setError("");
    setPreferences((prev) => prev.map((p) => (p.category === category ? { ...p, ...patch } : p)));
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, ...patch }),
      });
      if (!response.ok) throw new Error("preference");
    } catch {
      setPreferences(previous);
      setError(t("saveError"));
    }
  }

  if (loadFailed) return <main className="mx-auto min-h-[60dvh] max-w-xl px-6 py-28"><p role="alert">{tCompletion("loadError")}</p><button className="mt-4 text-primary underline" onClick={() => setReload((v) => v + 1)}>{tCompletion("retry")}</button></main>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  const tabs = [
    { id: "profile" as const, label: t("perfil"), description: t("perfilDescripcion"), icon: UserRound },
    { id: "security" as const, label: t("seguridad"), description: t("seguridadDescripcion"), icon: ShieldCheck },
    { id: "privacy" as const, label: t("privacidad"), description: t("privacidadDescripcion"), icon: Users },
    { id: "notifications" as const, label: t("preferenciasNotificaciones"), description: t("notificacionesDescripcion"), icon: Bell },
    { id: "wallet" as const, label: t("wallet"), description: t("walletDescripcion"), icon: Coins },
  ];

  return (
    <main className="min-h-screen px-4 pb-16 pt-24">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("titulo")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitulo")}</p>
        </div>

        <nav
          role="tablist"
          aria-label={t("secciones")}
          className="tfl-glass tfl-glass-soft grid gap-2 rounded-2xl border p-2 sm:grid-cols-2 lg:grid-cols-5"
        >
          {tabs.map(({ id, label, description, icon: Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`settings-${id}`}
                onClick={() => selectSection(id)}
                className={`flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring/40 ${
                  active
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/25"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{label}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-muted-foreground sm:hidden lg:block">{description}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

        <div id={`settings-${section}`} role="tabpanel" className="scroll-mt-28">
          {section === "profile" && profile && <ProfileSettings profile={profile} onUpdated={setProfile} />}

          {section === "security" && (
            <div className="space-y-6">
              <MySanctionsCard />
              <SecuritySettings />
            </div>
          )}

          {section === "privacy" && (
            <Card className="p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">{t("privacidad")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("privacidadDescripcion")}</p>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0 text-sm text-foreground">{t("permitirSolicitudes")}</span>
                <Toggle
                  label={t("permitirSolicitudes")}
                  checked={allowFriendRequests}
                  onChange={(v) => updatePrivacy({ allowFriendRequests: v })}
                />
              </div>

              <div className="py-3">
                <label className="mb-1.5 block text-sm text-foreground" htmlFor="friends-visibility">
                  {t("visibilidadAmigos")}
                </label>
                <select
                  id="friends-visibility"
                  value={visibility}
                  onChange={(e) => updatePrivacy({ friendsListVisibility: e.target.value as Visibility })}
                  className="min-h-11 w-full rounded-xl border border-input bg-input/30 px-4 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15"
                >
                  <option value="PUBLIC">{t("visibilidadTodos")}</option>
                  <option value="FRIENDS_ONLY">{t("visibilidadSoloAmigos")}</option>
                  <option value="PRIVATE">{t("visibilidadNadie")}</option>
                </select>
              </div>
            </Card>
          )}

          {section === "notifications" && (
            <Card className="p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">{t("preferenciasNotificaciones")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("notificacionesDescripcion")}</p>
              </div>

              <div className="divide-y divide-border">
                {NOTIFICATION_CATEGORIES.map((category) => {
                  const pref = preferences.find((p) => p.category === category);
                  return (
                    <div key={category} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm font-medium text-foreground">{tCategory(category)}</span>
                      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-5">
                        <div className="flex items-center justify-between gap-2 sm:justify-start">
                          <span className="text-xs text-muted-foreground">{t("enApp")}</span>
                          <Toggle
                            label={`${tCategory(category)} · ${t("enApp")}`}
                            checked={pref?.inAppEnabled ?? true}
                            onChange={(v) => updatePreference(category, { inAppEnabled: v })}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2 sm:justify-start">
                          <span className="text-xs text-muted-foreground">{t("enNavegador")}</span>
                          <Toggle
                            label={`${tCategory(category)} · ${t("enNavegador")}`}
                            checked={pref?.browserEnabled ?? true}
                            onChange={(v) => updatePreference(category, { browserEnabled: v })}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {section === "wallet" && <WalletSettings />}
        </div>
      </div>
    </main>
  );
}
