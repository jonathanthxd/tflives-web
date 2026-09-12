"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { CREATOR_PLATFORM_TYPES, type CreatorPlatformValue } from "@/modules/creators/validation";

type Platform = { type: CreatorPlatformValue; url: string };

export default function CreatorProfileEditor() {
  const t = useTranslations("Creators");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/creators/profile", { cache: "no-store" }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.creator) return;
      setHeadline(data.creator.headline || "");
      setDescription(data.creator.description || "");
      setPlatforms(data.creator.platforms || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function addPlatform() {
    const next = CREATOR_PLATFORM_TYPES.find((type) => !platforms.some((platform) => platform.type === type));
    if (next) setPlatforms((current) => [...current, { type: next, url: "" }]);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/creators/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ headline, description, platforms }) });
      if (!response.ok) throw new Error();
      setMessage(t("profileSaved"));
    } catch {
      setMessage(t("error"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">…</p>;
  return (
    <form onSubmit={save} className="mt-8 space-y-4 border-t border-border pt-7">
      <h2 className="font-display text-lg font-bold text-foreground">{t("manageProfile")}</h2>
      <label className="block text-sm font-medium text-foreground">{t("headline")}<input value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={100} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" /></label>
      <label className="block text-sm font-medium text-foreground">{t("descriptionLabel")}<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={4} required className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" /></label>
      <div><div className="flex items-center justify-between"><p className="text-sm font-medium text-foreground">{t("channels")}</p><button type="button" onClick={addPlatform} disabled={platforms.length >= CREATOR_PLATFORM_TYPES.length} className="inline-flex items-center gap-1 text-xs font-semibold text-primary disabled:opacity-40"><Plus className="size-3.5" aria-hidden="true" />{t("addPlatform")}</button></div><div className="mt-2 space-y-2">{platforms.map((platform, index) => <div key={`${platform.type}-${index}`} className="grid gap-2 sm:grid-cols-[12rem_1fr_auto]"><select value={platform.type} onChange={(event) => setPlatforms((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value as CreatorPlatformValue } : item))} className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm">{CREATOR_PLATFORM_TYPES.map((type) => <option key={type} value={type}>{t(`platformLabels.${type}`)}</option>)}</select><input value={platform.url} onChange={(event) => setPlatforms((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} placeholder="https://" required className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm" /><button type="button" onClick={() => setPlatforms((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-3 text-muted-foreground hover:text-destructive" aria-label={t("removePlatform")}><X className="size-4" aria-hidden="true" /></button></div>)}</div></div>
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
      <button type="submit" disabled={saving || platforms.length === 0} className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? t("submitting") : t("saveCreatorProfile")}</button>
    </form>
  );
}
