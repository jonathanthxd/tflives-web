"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { createClient } from "@/infrastructure/auth/client";
import { uploadProfileAsset } from "@/infrastructure/storage/avatars";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card } from "@/shared/ui/card";
import Reveal from "@/shared/ui/reveal";
import SocialCard from "@/modules/social/components/social-card";
import BadgesPlaceholder from "@/modules/achievements/components/badges-placeholder";
import RecentActivityPlaceholder from "@/modules/community/components/recent-activity-placeholder";
import CosmeticsPlaceholder from "@/modules/cosmetics/components/cosmetics-placeholder";

interface SocialLink {
  platform: string;
  url: string;
}

interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
  email: string;
  image: string | null;
  bannerUrl: string | null;
  bio: string | null;
  minecraftUsername: string | null;
  socialLinks: unknown;
  role: string;
  createdAt: Date;
}

function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is SocialLink =>
      !!item && typeof item === "object" && "platform" in item && "url" in item
  );
}

export default function ProfileView({ profile, isOwner }: { profile: Profile; isOwner: boolean }) {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const router = useRouter();
  const [current, setCurrent] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState(profile.bio || "");
  const [mcDraft, setMcDraft] = useState(profile.minecraftUsername || "");
  const [linksDraft, setLinksDraft] = useState<SocialLink[]>(parseSocialLinks(profile.socialLinks));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const displayName = current.displayName || current.name || current.username || "Usuario";
  const initial = (displayName[0] || "U").toUpperCase();
  const joinedDate = new Date(current.createdAt).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
  const links = parseSocialLinks(current.socialLinks);

  async function uploadAsset(file: File, kind: "avatar" | "banner") {
    const setUploading = kind === "avatar" ? setUploadingAvatar : setUploadingBanner;
    setUploading(true);
    setSaveError("");

    try {
      const supabase = createClient();
      const url = await uploadProfileAsset(supabase, current.id, file, kind);

      const field = kind === "avatar" ? "image" : "bannerUrl";
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: url }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCurrent((prev) => ({ ...prev, ...data.user }));
    } catch {
      setSaveError(kind === "avatar" ? t("errorSubirAvatar") : t("errorSubirBanner"));
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bioDraft,
          minecraftUsername: mcDraft,
          socialLinks: linksDraft.filter((l) => l.platform && l.url),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || t("errorGuardar"));
        return;
      }
      setCurrent((prev) => ({ ...prev, ...data.user }));
      setEditing(false);
    } catch {
      setSaveError(t("errorConexion"));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setBioDraft(current.bio || "");
    setMcDraft(current.minecraftUsername || "");
    setLinksDraft(parseSocialLinks(current.socialLinks));
    setSaveError("");
    setEditing(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <Reveal className="max-w-3xl mx-auto">
        <Card className="overflow-hidden">
          <div
            className="relative h-32 sm:h-44 bg-gradient-to-br from-primary/30 to-primary/5"
            style={
              current.bannerUrl
                ? {
                    backgroundImage: `url(${current.bannerUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {isOwner && (
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-foreground border border-border hover:border-primary/40 transition-colors disabled:opacity-50"
              >
                {uploadingBanner ? t("subiendoBanner") : t("cambiarBanner")}
              </button>
            )}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAsset(e.target.files[0], "banner")}
            />
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-10 mb-4 relative inline-block">
              {current.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.image}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-card"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-card flex items-center justify-center">
                  <span className="font-display text-2xl font-bold text-primary">{initial}</span>
                </div>
              )}
              {isOwner && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  aria-label={t("cambiarAvatar")}
                  className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.174C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadAsset(e.target.files[0], "avatar")}
              />
            </div>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">{displayName}</h1>
                {current.username && <p className="text-primary text-sm">@{current.username}</p>}
              </div>

              {isOwner && !editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  {t("editarPerfil")}
                </Button>
              )}
            </div>

            {saveError && <p className="mt-3 text-xs text-destructive">{saveError}</p>}

            {editing ? (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t("sobreMi")}</label>
                  <textarea
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    maxLength={280}
                    rows={3}
                    placeholder={t("sobreMiPlaceholder")}
                    className="w-full rounded-xl border border-input bg-input/30 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 resize-none"
                  />
                  <span className="text-xs text-muted-foreground">{bioDraft.length}/280</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    {t("usernameMinecraft")}
                  </label>
                  <Input
                    value={mcDraft}
                    onChange={(e) => setMcDraft(e.target.value)}
                    placeholder="Steve123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    {t("enlacesSociales")}
                  </label>
                  <div className="space-y-2">
                    {linksDraft.map((link, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={link.platform}
                          onChange={(e) =>
                            setLinksDraft((prev) =>
                              prev.map((l, idx) => (idx === i ? { ...l, platform: e.target.value } : l))
                            )
                          }
                          placeholder="Twitch"
                          className="w-28"
                        />
                        <Input
                          value={link.url}
                          onChange={(e) =>
                            setLinksDraft((prev) =>
                              prev.map((l, idx) => (idx === i ? { ...l, url: e.target.value } : l))
                            )
                          }
                          placeholder="https://..."
                        />
                        <button
                          type="button"
                          onClick={() => setLinksDraft((prev) => prev.filter((_, idx) => idx !== i))}
                          className="px-2 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={t("quitarEnlace")}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {linksDraft.length < 6 && (
                      <button
                        type="button"
                        onClick={() => setLinksDraft((prev) => [...prev, { platform: "", url: "" }])}
                        className="text-xs text-primary hover:underline"
                      >
                        {t("agregarEnlace")}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? t("guardando") : t("guardarCambios")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
                    {t("cancelar")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {current.bio && <p className="mt-4 text-foreground/90 whitespace-pre-line">{current.bio}</p>}
                {!current.bio && isOwner && (
                  <p className="mt-4 text-sm text-muted-foreground italic">
                    {t("bioVacia")}{" "}
                    <button onClick={() => setEditing(true)} className="text-primary hover:underline">
                      {t("agregarUna")}
                    </button>
                    .
                  </p>
                )}

                {links.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                        {link.platform}
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{t("seUnioEn")} {joinedDate}</span>
                  {current.minecraftUsername && (
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      MC: {current.minecraftUsername}
                    </span>
                  )}
                  {current.role !== "USER" && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {current.role}
                    </span>
                  )}
                </div>
              </>
            )}

            {isOwner && !editing && (
              <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-3">
                {current.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      {t("panelAdmin")}
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  {t("cerrarSesion")}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {!editing && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Reveal delay={0.05}>
              <SocialCard username={current.username!} />
            </Reveal>

            <Reveal delay={0.15}>
              <BadgesPlaceholder />
            </Reveal>

            <Reveal delay={0.05}>
              <RecentActivityPlaceholder />
            </Reveal>

            <Reveal delay={0.15}>
              <CosmeticsPlaceholder />
            </Reveal>
          </div>
        )}
      </Reveal>
    </main>
  );
}
