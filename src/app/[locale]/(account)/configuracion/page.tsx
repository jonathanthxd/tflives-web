"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card } from "@/shared/ui/card";
import { NOTIFICATION_CATEGORIES } from "@/modules/notifications/service";

type Visibility = "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";

interface Preference {
  category: string;
  inAppEnabled: boolean;
  browserEnabled: boolean;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const tNotif = useTranslations("Notifications");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [preferences, setPreferences] = useState<Preference[]>([]);

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/me");
      const me = await meRes.json();
      if (!me.user) {
        router.replace("/login?redirect=/configuracion");
        return;
      }

      const [privacyRes, prefsRes] = await Promise.all([
        fetch("/api/social/privacy"),
        fetch("/api/notifications/preferences"),
      ]);
      const privacy = await privacyRes.json();
      const prefs = await prefsRes.json();

      setAllowFriendRequests(privacy.allowFriendRequests ?? true);
      setVisibility(privacy.friendsListVisibility ?? "PUBLIC");
      setPreferences(prefs.preferences ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updatePrivacy(partial: { allowFriendRequests?: boolean; friendsListVisibility?: Visibility }) {
    if (partial.allowFriendRequests !== undefined) setAllowFriendRequests(partial.allowFriendRequests);
    if (partial.friendsListVisibility !== undefined) setVisibility(partial.friendsListVisibility);
    await fetch("/api/social/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
  }

  async function updatePreference(category: string, patch: Partial<Preference>) {
    setPreferences((prev) => prev.map((p) => (p.category === category ? { ...p, ...patch } : p)));
    await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, ...patch }),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">{t("titulo")}</h1>

        <Card className="p-6">
          <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            {t("privacidad")}
          </h2>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-foreground">{t("permitirSolicitudes")}</span>
            <Toggle
              checked={allowFriendRequests}
              onChange={(v) => updatePrivacy({ allowFriendRequests: v })}
            />
          </div>

          <div className="py-2">
            <label className="block text-sm text-foreground mb-1.5">{t("visibilidadAmigos")}</label>
            <select
              value={visibility}
              onChange={(e) => updatePrivacy({ friendsListVisibility: e.target.value as Visibility })}
              className="w-full rounded-xl border border-input bg-input/30 px-4 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15"
            >
              <option value="PUBLIC">{t("visibilidadTodos")}</option>
              <option value="FRIENDS_ONLY">{t("visibilidadSoloAmigos")}</option>
              <option value="PRIVATE">{t("visibilidadNadie")}</option>
            </select>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            {t("preferenciasNotificaciones")}
          </h2>

          <div className="space-y-4">
            {NOTIFICATION_CATEGORIES.map((category) => {
              const pref = preferences.find((p) => p.category === category);
              return (
                <div key={category} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{tNotif(`message.${category}`)}</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {t("enApp")}
                      <Toggle
                        checked={pref?.inAppEnabled ?? true}
                        onChange={(v) => updatePreference(category, { inAppEnabled: v })}
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {t("enNavegador")}
                      <Toggle
                        checked={pref?.browserEnabled ?? true}
                        onChange={(v) => updatePreference(category, { browserEnabled: v })}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </main>
  );
}
