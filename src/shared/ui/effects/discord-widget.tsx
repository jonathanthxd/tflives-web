"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Radio, Users, X } from "lucide-react";

interface Counts {
  member_count: number | null;
  presence_count: number | null;
}

function DiscordMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.05 6.55c1.24-.55 2.56-.82 3.95-.82 1.39 0 2.71.27 3.95.82.16-.29.35-.62.58-.97 1.55.48 2.75 1.16 3.62 2.03.99 1.8 1.55 3.82 1.68 6.08-1.03 1.46-2.39 2.57-4.08 3.34-.41-.56-.78-1.14-1.09-1.75.6-.23 1.17-.51 1.7-.85-.14-.1-.28-.2-.41-.31-1.65.76-3.63 1.15-5.95 1.15s-4.3-.39-5.95-1.15c-.13.11-.27.21-.41.31.53.34 1.1.62 1.7.85-.31.61-.68 1.19-1.09 1.75-1.69-.77-3.05-1.88-4.08-3.34.13-2.26.69-4.28 1.68-6.08.87-.87 2.07-1.55 3.62-2.03.23.35.42.68.58.97Z"
        fill="currentColor"
      />
      <path
        d="M9.25 13.72c.86 0 1.55-.77 1.55-1.72s-.7-1.72-1.55-1.72c-.86 0-1.55.77-1.55 1.72s.69 1.72 1.55 1.72Zm5.5 0c.86 0 1.55-.77 1.55-1.72s-.69-1.72-1.55-1.72-1.55.77-1.55 1.72.69 1.72 1.55 1.72Z"
        fill="white"
      />
    </svg>
  );
}

export default function DiscordWidget() {
  const t = useTranslations("Content");
  const [data, setData] = useState<Counts | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const update = () =>
      fetch("/api/discord", { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error();
          return response.json();
        })
        .then(setData)
        .catch(() => {});

    void update();
    const timer = window.setInterval(update, 300_000);
    return () => {
      window.clearInterval(timer);
      controller.abort();
    };
  }, []);

  const members = data?.member_count != null ? data.member_count.toLocaleString() : t("unavailable");
  const online = data?.presence_count != null ? data.presence_count.toLocaleString() : t("unavailable");
  const hasOnline = data?.presence_count != null && data.presence_count > 0;

  return (
    <div
      className="fixed left-3 z-40 sm:left-5"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      {open && (
        <section className="absolute bottom-[calc(100%+0.75rem)] left-0 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.35rem] border border-[#5865F2]/35 bg-card/96 shadow-[0_24px_80px_-28px_rgba(88,101,242,0.55)] backdrop-blur-xl">
          <div className="relative overflow-hidden border-b border-white/5 px-4 pb-4 pt-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(88,101,242,0.32),transparent_52%),linear-gradient(135deg,rgba(88,101,242,0.14),transparent_56%)]" />
            <div className="pointer-events-none absolute -right-9 -top-10 h-28 w-28 rounded-full border border-[#5865F2]/20 bg-[#5865F2]/10 blur-sm" />

            <div className="relative flex items-start gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5865F2] text-white shadow-[0_10px_30px_-10px_rgba(88,101,242,0.9)] ring-1 ring-white/15">
                <DiscordMark className="h-7 w-7" />
                {hasOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-card bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                )}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <p className="font-display text-sm font-semibold text-foreground">TFLives</p>
                  <span className="rounded-md bg-[#5865F2]/14 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.13em] text-[#7C86FF]">Discord</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("communityDescription")}</p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("cancel")}
                className="rounded-lg p-1.5 text-muted-foreground transition-all hover:rotate-6 hover:bg-[#5865F2]/10 hover:text-[#7C86FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2]/35"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="rounded-xl border border-border/80 bg-background/45 p-3 shadow-inner shadow-white/[0.02]">
              <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{t("members")}</span>
              </div>
              <p className="text-lg font-semibold tabular-nums text-foreground">{members}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/45 p-3 shadow-inner shadow-white/[0.02]">
              <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                <Radio className={`h-3.5 w-3.5 ${hasOnline ? "text-emerald-400" : "text-muted-foreground"}`} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{t("onlineMembers")}</span>
              </div>
              <p className="text-lg font-semibold tabular-nums text-foreground">{online}</p>
            </div>
          </div>

          <div className="px-3 pb-3">
            <a
              href="https://discord.com/invite/c3jFPyJ9vd"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full items-center justify-between rounded-xl bg-[#5865F2] px-3.5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(88,101,242,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6370F4] hover:shadow-[0_16px_34px_-14px_rgba(88,101,242,1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5865F2]/25"
            >
              <span className="flex items-center gap-2.5">
                <DiscordMark className="h-5 w-5" />
                {t("discord")}
              </span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </section>
      )}

      <button
        type="button"
        data-discord-fab
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={t("discord")}
        className="group relative flex h-14 w-14 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/15 bg-[#5865F2] px-0 text-white shadow-[0_13px_32px_-14px_rgba(88,101,242,0.85)] transition-[width,transform,box-shadow,background-color] duration-200 hover:-translate-y-1 hover:bg-[#6370F4] hover:shadow-[0_18px_38px_-13px_rgba(88,101,242,0.95)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5865F2]/25 sm:w-40 sm:justify-start sm:px-3"
      >
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_10%,rgba(255,255,255,0.18),transparent_38%)] opacity-90" />
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 transition-transform duration-200 group-hover:scale-105">
          <DiscordMark className="h-[1.35rem] w-[1.35rem]" />
          {hasOnline && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#5865F2] bg-emerald-400" />
          )}
        </span>
        <span className="relative hidden min-w-0 text-left sm:block">
          <span className="block truncate text-xs font-semibold leading-tight">Discord</span>
          <span className="mt-0.5 block truncate text-[10px] text-white/75">
            {data?.presence_count != null ? `${online} ${t("onlineMembers").toLowerCase()}` : "TFLives Community"}
          </span>
        </span>
      </button>
    </div>
  );
}
