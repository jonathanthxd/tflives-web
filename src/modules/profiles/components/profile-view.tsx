"use client";
/* eslint-disable @next/next/no-img-element -- public profile media may be an OAuth image or local asset route. */

import { CalendarDays, ExternalLink, Gauge, Gamepad2, Pencil, ShieldAlert, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import AchievementsCard from "@/modules/achievements/components/achievements-card";
import RecentActivity from "@/modules/community/components/recent-activity";
import { UserAvatar } from "@/modules/profiles/components/user-identity";
import { identityName, type PublicProfile } from "@/modules/profiles/types";
import SocialCard from "@/modules/social/components/social-card";
import { Card } from "@/shared/ui/card";
import Reveal from "@/shared/ui/reveal";

function roleLabel(role: PublicProfile["role"], t: ReturnType<typeof useTranslations>) {
  if (role === "ADMIN") return t("admin");
  if (role === "MOD") return t("moderador");
  return null;
}

export default function ProfileView({
  profile,
  isOwner,
}: {
  profile: PublicProfile | null;
  isOwner: boolean;
}) {
  const t = useTranslations("Profile");
  const locale = useLocale();

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center px-4 pt-20">
        <Card className="mx-auto max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto size-9 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 font-display text-xl font-bold text-foreground">{t("perfilNoDisponible")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("perfilBloqueadoDescripcion")}</p>
          <Link href="/comunidad" className="mt-5 inline-flex text-sm font-medium text-primary hover:underline">
            {t("volverComunidad")}
          </Link>
        </Card>
      </main>
    );
  }

  const displayName = identityName(profile);
  const joinedDate = new Intl.DateTimeFormat(locale === "es" ? "es-CO" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(profile.createdAt));
  const role = roleLabel(profile.role, t);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] overflow-hidden">
        <div className="absolute left-1/2 top-[-180px] size-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <Reveal className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-3xl border border-primary/10 bg-card/40 shadow-[0_20px_60px_-30px_hsl(var(--primary)/0.35)]">
          <div className="relative h-44 sm:h-60">
            {profile.bannerUrl ? (
              <img src={profile.bannerUrl} alt="" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-primary/25 via-card to-background">
                <div className="absolute -left-10 -top-16 size-64 rounded-full bg-primary/40 blur-[90px] animate-aurora-drift" />
                <div className="absolute right-0 top-1/3 size-56 rounded-full bg-primary/25 blur-[80px] animate-aurora-drift-slow" />
                <div className="absolute bottom-[-40px] left-1/3 size-48 rounded-full bg-primary/20 blur-[70px] animate-aurora-drift" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card/95 to-transparent" />
          </div>

          <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
            <UserAvatar
              identity={profile}
              alt={displayName}
              className="-mt-14 size-28 border-4 border-card text-4xl shadow-xl shadow-black/20 sm:-mt-16 sm:size-32"
            />
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="break-words font-display text-2xl font-bold text-foreground sm:text-3xl">{displayName}</h1>
                  {role && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {profile.role === "ADMIN" ? <ShieldCheck className="size-3.5" aria-hidden="true" /> : <ShieldAlert className="size-3.5" aria-hidden="true" />}
                      {role}
                    </span>
                  )}
                </div>
                {profile.username && <p className="mt-1 font-mono text-sm text-primary/85">@{profile.username}</p>}
              </div>
              {isOwner && (
                <Link
                  href="/configuracion#profile"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  {t("editarPerfil")}
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="space-y-6">
            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">{t("sobreMi")}</h2>
              {profile.bio ? (
                <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">{profile.bio}</p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">{t("bioVacia")}</p>
              )}
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2"><CalendarDays className="size-4 text-primary" aria-hidden="true" />{t("miembroDesde", { date: joinedDate })}</span>
                {profile.minecraftUsername && <span className="inline-flex items-center gap-2"><Gamepad2 className="size-4 text-primary" aria-hidden="true" />{profile.minecraftUsername}</span>}
              </div>
            </Card>

            {profile.socialLinks.length > 0 && (
              <Card className="p-5 sm:p-6">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">{t("enlacesSociales")}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.socialLinks.map((link) => (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm font-medium capitalize text-foreground transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <span className="truncate">{t(`platform.${link.platform}`)}</span>
                      <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </Card>
            )}

            {profile.username && <RecentActivity username={profile.username} />}
          </div>

          <aside className="space-y-6">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Gauge className="size-4 text-primary" aria-hidden="true" />
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">{t("progression")}</h2>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
                  {t("level", { level: profile.progress.level })}
                </span>
              </div>
              <div className="mt-4">
                <div
                  role="progressbar"
                  aria-label={t("progressBar", { level: profile.progress.level })}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(profile.progress.progressPercent)}
                  className="h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${profile.progress.progressPercent}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("xpToNext", { xp: profile.progress.xp, nextXp: profile.progress.nextLevelXp })}
                </p>
              </div>
            </Card>
            {!isOwner && profile.username && <SocialCard username={profile.username} />}
            {profile.username && <AchievementsCard username={profile.username} />}
          </aside>
        </div>
      </Reveal>
    </main>
  );
}
