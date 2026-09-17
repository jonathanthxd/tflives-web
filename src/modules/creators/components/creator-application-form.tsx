"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import CreatorProfileEditor from "@/modules/creators/components/creator-profile-editor";
import { CREATOR_CATEGORIES, CREATOR_PLATFORM_TYPES, type CreatorCategoryValue, type CreatorPlatformValue } from "@/modules/creators/validation";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface Application {
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionMessage: string | null;
}

const initial = { primaryPlatform: "TWITCH" as CreatorPlatformValue, channelUrl: "", category: "MINECRAFT" as CreatorCategoryValue, description: "", motivation: "", activityFrequency: "" };

export default function CreatorApplicationForm() {
  const tCompletion = useTranslations("Completion");
  const [loadFailed, setLoadFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const t = useTranslations("Creators");
  const [application, setApplication] = useState<Application | null>(null);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    fetch("/api/creators/application", { cache: "no-store" }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("request_failed");
      setApplication(data.application);
    }).catch(() => setLoadFailed(true)).finally(() => setLoading(false));
  }, [reload]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setMessageKind(null);
    try {
      const response = await fetch("/api/creators/application", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error);
      setApplication({ status: "PENDING", rejectionMessage: null });
      setMessage(t("applicationSent"));
      setMessageKind("success");
    } catch {
      setMessage(t("error"));
      setMessageKind("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadFailed) return <div role="alert" className="rounded-2xl border border-destructive/20 p-6 text-sm"><p>{tCompletion("loadError")}</p><button onClick={() => { setLoadFailed(false); setLoading(true); setReload((value) => value + 1); }} className="mt-3 text-primary underline">{tCompletion("retry")}</button></div>;
  if (loading) return <div aria-busy="true" className="rounded-2xl border border-border bg-card p-6"><div className="h-4 w-40 animate-pulse rounded bg-muted" /><div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-muted" /></div>;
  if (application?.status === "APPROVED") return <div role="status" className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6"><p className="text-sm text-emerald-700 dark:text-emerald-300">{t("applicationApproved")}</p><CreatorProfileEditor /></div>;
  if (application?.status === "PENDING") return <div role="status" className="rounded-2xl border border-primary/20 bg-card p-6 text-sm text-muted-foreground">{t("applicationPending")}</div>;

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-7">
      {application?.status === "REJECTED" && <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200"><p className="font-medium">{t("applicationRejected")}</p>{application.rejectionMessage && <p className="mt-1">{t("rejectionReason")}: {application.rejectionMessage}</p>}<p className="mt-2">{t("reapply")}</p></div>}
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-foreground">{t("primaryPlatform")}<select value={form.primaryPlatform} onChange={(event) => setForm((current) => ({ ...current, primaryPlatform: event.target.value as CreatorPlatformValue }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15">{CREATOR_PLATFORM_TYPES.map((type) => <option key={type} value={type}>{t(`platformLabels.${type}`)}</option>)}</select></label><label className="text-sm font-medium text-foreground">{t("category")}<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as CreatorCategoryValue }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15">{CREATOR_CATEGORIES.map((category) => <option key={category} value={category}>{t(`categoryLabels.${category}`)}</option>)}</select></label></div>
      <label className="block text-sm font-medium text-foreground">{t("channelUrl")}<Input type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" value={form.channelUrl} onChange={(event) => setForm((current) => ({ ...current, channelUrl: event.target.value }))} placeholder="https://" required className="mt-1.5" /></label>
      <label className="block text-sm font-medium text-foreground">{t("descriptionLabel")}<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} maxLength={280} rows={3} required className="mt-1.5 w-full rounded-xl border border-input bg-input/30 px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15" /></label>
      <label className="block text-sm font-medium text-foreground">{t("motivation")}<textarea value={form.motivation} onChange={(event) => setForm((current) => ({ ...current, motivation: event.target.value }))} maxLength={500} rows={4} required className="mt-1.5 w-full rounded-xl border border-input bg-input/30 px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15" /></label>
      <label className="block text-sm font-medium text-foreground">{t("activityFrequency")}<Input value={form.activityFrequency} onChange={(event) => setForm((current) => ({ ...current, activityFrequency: event.target.value }))} maxLength={120} className="mt-1.5" /></label>
      {message && <p role={messageKind === "error" ? "alert" : "status"} className={`text-sm ${messageKind === "error" ? "text-destructive" : "text-emerald-700 dark:text-emerald-300"}`}>{message}</p>}
      <Button type="submit" disabled={submitting}>{submitting ? t("submitting") : t("submitApplication")}</Button>
    </form>
  );
}
