"use client";
/* eslint-disable @next/next/no-img-element -- user/OAuth media has dynamic trusted hosts. */

import { Camera, CheckCircle2, ImageIcon, Link as LinkIcon, Save, UserRound } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import { UserAvatar } from "@/modules/profiles/components/user-identity";
import {
  SOCIAL_PLATFORMS,
  parseSocialLinks,
  type PublicProfile,
  type SocialLink,
  type SocialPlatform,
} from "@/modules/profiles/types";

export type EditableProfile = Omit<Pick<
  PublicProfile,
  "username" | "displayName" | "name" | "image" | "bannerUrl" | "bio" | "minecraftUsername" | "socialLinks"
>, "socialLinks"> & { socialLinks: unknown };

type FormState = {
  displayName: string;
  username: string;
  bio: string;
  minecraftUsername: string;
  social: Record<SocialPlatform, string>;
};

function profileToForm(profile: EditableProfile): FormState {
  const social = Object.fromEntries(SOCIAL_PLATFORMS.map((platform) => [platform, ""])) as Record<SocialPlatform, string>;
  for (const link of parseSocialLinks(profile.socialLinks)) social[link.platform] = link.url;
  return {
    displayName: profile.displayName || "",
    username: profile.username || "",
    bio: profile.bio || "",
    minecraftUsername: profile.minecraftUsername || "",
    social,
  };
}

function toEditableProfile(value: PublicProfile): EditableProfile {
  return {
    username: value.username,
    displayName: value.displayName,
    name: value.name,
    image: value.image,
    bannerUrl: value.bannerUrl,
    bio: value.bio,
    minecraftUsername: value.minecraftUsername,
    socialLinks: value.socialLinks,
  };
}

export function ProfileSettings({ profile, onUpdated }: { profile: EditableProfile; onUpdated?: (profile: EditableProfile) => void }) {
  const t = useTranslations("ProfileSettings");
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(profile);
  const [draft, setDraft] = useState(() => profileToForm(profile));
  const [savedDraft, setSavedDraft] = useState(() => profileToForm(profile));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(savedDraft), [draft, savedDraft]);
  const visibleName = draft.displayName.trim() || current.name || draft.username || "TFLives";

  function applyProfile(next: PublicProfile) {
    const editable = toEditableProfile(next);
    setCurrent(editable);
    onUpdated?.(editable);
    return editable;
  }

  async function uploadAsset(file: File, kind: "avatar" | "banner") {
    setUploading(kind);
    setError("");
    setNotice("");
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("kind", kind);
      const response = await fetch("/api/profile/assets", { method: "POST", body: data });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(t("uploadFailed"));
        return;
      }
      applyProfile(payload.user as PublicProfile);
      setNotice(kind === "avatar" ? t("avatarUpdated") : t("bannerUpdated"));
    } catch {
      setError(t("connectionError"));
    } finally {
      setUploading(null);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const socialLinks: SocialLink[] = SOCIAL_PLATFORMS.flatMap((platform) => {
      const url = draft.social[platform].trim();
      return url ? [{ platform, url }] : [];
    });
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: draft.displayName,
          username: draft.username,
          bio: draft.bio,
          minecraftUsername: draft.minecraftUsername,
          socialLinks,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(t("saveFailed"));
        return;
      }
      const editable = applyProfile(payload.user as PublicProfile);
      const nextDraft = profileToForm(editable);
      setDraft(nextDraft);
      setSavedDraft(nextDraft);
      setNotice(t("saved"));
    } catch {
      setError(t("connectionError"));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setDraft(savedDraft);
    setError("");
    setNotice("");
  }

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <Card className="overflow-hidden">
        <div className="relative h-28 bg-gradient-to-br from-primary/25 via-card to-background sm:h-36">
          {current.bannerUrl && <img src={current.bannerUrl} alt="" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" />}
          <button
            type="button"
            onClick={() => bannerInput.current?.click()}
            disabled={uploading !== null}
            className="absolute right-4 top-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/15 bg-background/80 px-3 py-2 text-xs font-medium text-foreground backdrop-blur transition hover:border-primary/40 disabled:opacity-60"
          >
            <ImageIcon className="size-3.5" aria-hidden="true" />
            {uploading === "banner" ? t("uploading") : t("changeBanner")}
          </button>
          <input ref={bannerInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void uploadAsset(file, "banner");
          }} />
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:p-6">
          <div className="relative -mt-14 shrink-0">
            <UserAvatar
              identity={{ ...current, displayName: visibleName }}
              className="size-24 border-4 border-card text-3xl shadow-lg"
              alt={visibleName}
            />
            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              disabled={uploading !== null}
              aria-label={t("changeAvatar")}
              className="absolute -bottom-1 -right-1 grid size-10 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
            >
              <Camera className="size-3.5" aria-hidden="true" />
            </button>
            <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) void uploadAsset(file, "avatar");
            }} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold text-foreground">{visibleName}</p>
            {draft.username && <p className="mt-0.5 truncate font-mono text-sm text-primary">@{draft.username.trim().toLowerCase()}</p>}
            <p className="mt-1 text-xs text-muted-foreground">{t("mediaHint")}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><UserRound className="size-4" aria-hidden="true" /></span>
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">{t("identityTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("identityDescription")}</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label={t("displayName")} htmlFor="profile-display-name">
            <Input id="profile-display-name" value={draft.displayName} maxLength={60} onChange={(event) => setDraft((value) => ({ ...value, displayName: event.target.value }))} placeholder={t("displayNamePlaceholder")} />
          </FormField>
          <FormField label={t("username")} htmlFor="profile-username" description={t("usernameHint")}>
            <Input id="profile-username" value={draft.username} maxLength={20} autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(event) => setDraft((value) => ({ ...value, username: event.target.value }))} placeholder="tflives_member" />
          </FormField>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <FormField label={t("bio")} htmlFor="profile-bio">
          <textarea
            id="profile-bio"
            value={draft.bio}
            maxLength={240}
            rows={5}
            onChange={(event) => setDraft((value) => ({ ...value, bio: event.target.value }))}
            placeholder={t("bioPlaceholder")}
            className="min-h-28 w-full resize-y rounded-xl border border-input bg-input/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15"
          />
          <p className="mt-1.5 text-right text-xs text-muted-foreground">{t("characters", { count: draft.bio.length, max: 240 })}</p>
        </FormField>
        <div className="mt-5">
          <FormField label={t("minecraftUsername")} htmlFor="profile-minecraft">
            <Input id="profile-minecraft" value={draft.minecraftUsername} maxLength={16} autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(event) => setDraft((value) => ({ ...value, minecraftUsername: event.target.value }))} placeholder="Player_123" />
          </FormField>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><LinkIcon className="size-4" aria-hidden="true" /></span>
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">{t("socialTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("socialDescription")}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform) => (
            <FormField key={platform} label={t(`platform.${platform}`)} htmlFor={`social-${platform}`}>
              <Input id={`social-${platform}`} type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={draft.social[platform]} onChange={(event) => setDraft((value) => ({ ...value, social: { ...value.social, [platform]: event.target.value } }))} placeholder={platform === "website" ? "https://example.com" : `https://${platform}.com/`} />
            </FormField>
          ))}
        </div>
      </Card>

      <div aria-live="polite" className="min-h-5 text-sm">
        {error && <p className="text-destructive">{error}</p>}
        {!error && notice && <p className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-4" aria-hidden="true" />{notice}</p>}
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" disabled={!dirty || saving} onClick={reset}>{t("discard")}</Button>
        <Button type="submit" disabled={!dirty || saving}>
          <Save className="size-4" aria-hidden="true" data-icon="inline-start" />
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
