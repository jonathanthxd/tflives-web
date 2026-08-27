"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import {
  Camera,
  Pencil,
  ShieldCheck,
  ShieldAlert,
  CalendarDays,
  Gamepad2,
  LogOut,
  LayoutDashboard,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/infrastructure/auth/client";
import { uploadProfileAsset } from "@/infrastructure/storage/avatars";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card } from "@/shared/ui/card";
import Reveal from "@/shared/ui/reveal";
import SocialCard from "@/modules/social/components/social-card";
import AchievementsCard from "@/modules/achievements/components/achievements-card";
import RecentActivity from "@/modules/community/components/recent-activity";
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
  const tp = useTranslations("ProfilePlaceholders");
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
  const isStaff = current.role === "ADMIN" || current.role === "MOD";

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
    <main className="relative min-h-screen pt-24 pb-16 px-4 overflow-hidden">
      {/* Atmosphere: page-wide ambient glow behind everything */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] overflow-hidden">
        <div className="absolute left-1/2 top-[-180px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <Reveal className="max-w-5xl mx-auto">
        {/* ---------- HERO ---------- */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-card/40 shadow-[0_20px_60px_-30px_hsl(var(--primary)/0.35)]">
          {/* Banner */}
          <div className="relative h-48 sm:h-64">
            {current.bannerUrl ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${current.bannerUrl})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-card to-background">
                <div aria-hidden className="absolute inset-0 overflow-hidden">
                  <div className="absolute -left-10 -top-16 h-64 w-64 rounded-full bg-primary/40 blur-[90px] animate-aurora-drift" />
                  <div className="absolute right-0 top-1/3 h-56 w-56 rounded-full bg-primary/25 blur-[80px] animate-aurora-drift-slow" />
                  <div className="absolute bottom-[-40px] left-1/3 h-48 w-48 rounded-full bg-primary/20 blur-[70px] animate-aurora-drift" />
                </div>
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                  }}
                />
              </div>
            )}

            {/* gloss sweep */}
            <div aria-hidden className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-sweep" />
            </div>

            {/* fade into content */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card/95 to-transparent" />

            {isOwner && (
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-foreground border border-white/10 hover:border-primary/40 hover:bg-background/90 transition-all duration-200 disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />
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

          <div className="relative px-6 sm:px-8 pb-8">
            {/* Avatar with animated ring */}
            <div className="-mt-14 sm:-mt-16 mb-4 relative inline-block">
              <div
                className="absolute -inset-1.5 rounded-full opacity-80 animate-[spin_7s_linear_infinite]"
                style={{
                  background:
                    "conic-gradient(from 0deg, hsl(var(--primary)) 0deg, transparent 110deg, transparent 250deg, hsl(var(--primary)) 360deg)",
                }}
                aria-hidden
              />
              <div className="absolute -inset-1.5 rounded-full bg-primary/25 blur-md animate-glow-pulse" aria-hidden />
              <div className="relative rounded-full bg-card p-1">
                {current.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.image}
                    alt={displayName}
                    className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                    <span className="font-display text-4xl font-bold text-primary">{initial}</span>
                  </div>
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  aria-label={t("cambiarAvatar")}
                  className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_14px_hsl(var(--primary)/0.5)] hover:bg-primary/90 hover:scale-105 transition-all duration-200 disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" strokeWidth={2} />
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
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {displayName}
                  </h1>
                  {isStaff && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                        current.role === "ADMIN"
                          ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_16px_hsl(var(--primary)/0.25)]"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-[0_0_16px_hsl(38_92%_50%/0.2)]"
                      }`}
                    >
                      {current.role === "ADMIN" ? (
                        <ShieldCheck className="h-3 w-3" strokeWidth={2.25} />
                      ) : (
                        <ShieldAlert className="h-3 w-3" strokeWidth={2.25} />
                      )}
                      {current.role}
                    </span>
                  )}
                </div>
                {current.username && (
                  <p className="mt-1 font-mono text-sm text-primary/80">@{current.username}</p>
                )}
              </div>

              {isOwner && !editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" strokeWidth={2} data-icon="inline-start" />
                  {t("editarPerfil")}
                </Button>
              )}
            </div>

            {saveError && <p className="mt-3 text-xs text-destructive">{saveError}</p>}

            {editing ? (
              <div className="mt-6 space-y-4 animate-rise-in">
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
                {current.bio && (
                  <p className="mt-4 max-w-2xl text-foreground/85 leading-relaxed whitespace-pre-line">
                    {current.bio}
                  </p>
                )}
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
                        className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3.5 py-1.5 text-xs font-medium text-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:-translate-y-0.5"
                      >
                        <LinkIcon className="h-3 w-3 transition-transform group-hover:rotate-45" strokeWidth={2} />
                        {link.platform}
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1">
                    <CalendarDays className="h-3 w-3" strokeWidth={1.75} />
                    {t("seUnioEn")} {joinedDate}
                  </span>
                  {current.minecraftUsername && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1">
                      <Gamepad2 className="h-3 w-3" strokeWidth={1.75} />
                      {current.minecraftUsername}
                    </span>
                  )}
                </div>
              </>
            )}

            {isOwner && !editing && (
              <div className="mt-6 pt-6 border-t border-border/60 flex flex-wrap gap-3">
                {current.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={2} data-icon="inline-start" />
                      {t("panelAdmin")}
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5" strokeWidth={2} data-icon="inline-start" />
                  {t("cerrarSesion")}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ---------- CONTENT GRID ---------- */}
        {!editing && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Reveal delay={0.05} className="lg:col-span-2">
              <RecentActivity username={current.username!} />
            </Reveal>

            <Reveal delay={0.1}>
              <SocialCard username={current.username!} />
            </Reveal>

            <Reveal delay={0.15} className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <AchievementsCard username={current.username!} />
              <CosmeticsPlaceholder />
            </Reveal>

            <Reveal delay={0.2}>
              <Card className="p-6 h-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-primary/5 to-transparent">
                <Sparkles className="h-6 w-6 text-primary/60 mb-2" strokeWidth={1.5} />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tp("mas")}
                </p>
              </Card>
            </Reveal>
          </div>
        )}
      </Reveal>
    </main>
  );
}
