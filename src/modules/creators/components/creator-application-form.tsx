"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import CreatorProfileEditor from "@/modules/creators/components/creator-profile-editor";
import { CREATOR_CATEGORIES, CREATOR_PLATFORM_TYPES, type CreatorCategoryValue, type CreatorPlatformValue } from "@/modules/creators/validation";

interface Application {
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionMessage: string | null;
}

const initial = { primaryPlatform: "TWITCH" as CreatorPlatformValue, channelUrl: "", category: "MINECRAFT" as CreatorCategoryValue, description: "", motivation: "", activityFrequency: "" };

export default function CreatorApplicationForm() {
  const t = useTranslations("Creators");
  const [application, setApplication] = useState<Application | null>(null);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/creators/application", { cache: "no-store" }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (response.ok) setApplication(data.application);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/creators/application", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error);
      setApplication({ status: "PENDING", rejectionMessage: null });
      setMessage(t("applicationSent"));
    } catch {
      setMessage(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">…</div>;
  if (application?.status === "APPROVED") return <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6"><p className="text-sm text-emerald-700 dark:text-emerald-300">{t("applicationApproved")}</p><CreatorProfileEditor /></div>;
  if (application?.status === "PENDING") return <div className="rounded-2xl border border-primary/20 bg-card p-6 text-sm text-muted-foreground">{t("applicationPending")}</div>;

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-7">
      {application?.status === "REJECTED" && <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200"><p className="font-medium">{t("applicationRejected")}</p>{application.rejectionMessage && <p className="mt-1">{t("rejectionReason")}: {application.rejectionMessage}</p>}<p className="mt-2">{t("reapply")}</p></div>}
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-foreground">{t("primaryPlatform")}<select value={form.primaryPlatform} onChange={(event) => setForm((current) => ({ ...current, primaryPlatform: event.target.value as CreatorPlatformValue }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">{CREATOR_PLATFORM_TYPES.map((type) => <option key={type} value={type}>{t(`platformLabels.${type}`)}</option>)}</select></label><label className="text-sm font-medium text-foreground">{t("category")}<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as CreatorCategoryValue }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">{CREATOR_CATEGORIES.map((category) => <option key={category} value={category}>{t(`categoryLabels.${category}`)}</option>)}</select></label></div>
      <label className="block text-sm font-medium text-foreground">{t("channelUrl")}<input type="url" value={form.channelUrl} onChange={(event) => setForm((current) => ({ ...current, channelUrl: event.target.value }))} placeholder="https://" required className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" /></label>
      <label className="block text-sm font-medium text-foreground">{t("descriptionLabel")}<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} maxLength={280} rows={3} required className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /></label>
      <label className="block text-sm font-medium text-foreground">{t("motivation")}<textarea value={form.motivation} onChange={(event) => setForm((current) => ({ ...current, motivation: event.target.value }))} maxLength={500} rows={4} required className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /></label>
      <label className="block text-sm font-medium text-foreground">{t("activityFrequency")}<input value={form.activityFrequency} onChange={(event) => setForm((current) => ({ ...current, activityFrequency: event.target.value }))} maxLength={120} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" /></label>
      {message && <p role="status" className="text-sm text-destructive">{message}</p>}
      <button type="submit" disabled={submitting} className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{submitting ? t("submitting") : t("submitApplication")}</button>
    </form>
  );
}
