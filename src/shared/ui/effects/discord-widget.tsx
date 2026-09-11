"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Radio, UsersRound, X } from "lucide-react";

interface Counts {
  member_count: number | null;
  presence_count: number | null;
}

/** Discord's recognizable Clyde symbol, rendered from the official logo geometry. */
function DiscordLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 256 199"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
    >
      <path
        fill="currentColor"
        d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0C96.91 9.646 94.192 4.113 91.897 0a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z"
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
        <section className="absolute bottom-[calc(100%+0.8rem)] left-0 w-[min(21rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101116]/95 shadow-[0_26px_90px_-30px_rgba(0,0,0,0.82),0_18px_48px_-24px_rgba(88,101,242,0.72)] backdrop-blur-2xl">
          <div className="relative overflow-hidden px-4 pb-4 pt-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(88,101,242,0.38),transparent_44%),radial-gradient(circle_at_100%_28%,rgba(125,135,255,0.14),transparent_38%)]" />
            <div className="pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full border border-white/5 bg-[#5865F2]/10 blur-xl" />

            <div className="relative flex items-start gap-3.5">
              <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-[1rem] bg-[#5865F2] text-white shadow-[0_12px_34px_-14px_rgba(88,101,242,1)] ring-1 ring-white/20">
                <DiscordLogo className="h-6 w-8" />
                {hasOnline && (
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-[#101116] bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.75)]" />
                )}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-[15px] font-semibold tracking-[-0.01em] text-white">TFLives</p>
                  <span className="rounded-full border border-[#7b86ff]/20 bg-[#5865F2]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#aab2ff]">
                    Discord
                  </span>
                </div>
                <p className="mt-1.5 max-w-[14.5rem] text-[11px] leading-relaxed text-white/55">{t("communityDescription")}</p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("cancel")}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.035] text-white/45 transition-colors hover:border-white/10 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2]/55"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="border-t border-white/[0.065] bg-black/10 px-3.5 py-3.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/[0.065] bg-white/[0.035] px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-white/45">
                  <UsersRound className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em]">{t("members")}</span>
                </div>
                <p className="mt-1.5 text-[17px] font-semibold tabular-nums tracking-tight text-white">{members}</p>
              </div>

              <div className="rounded-2xl border border-white/[0.065] bg-white/[0.035] px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-white/45">
                  <Radio className={`h-3.5 w-3.5 ${hasOnline ? "text-emerald-400" : ""}`} />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em]">{t("onlineMembers")}</span>
                </div>
                <p className="mt-1.5 text-[17px] font-semibold tabular-nums tracking-tight text-white">{online}</p>
              </div>
            </div>

            <a
              href="https://discord.com/invite/c3jFPyJ9vd"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-2.5 flex w-full items-center justify-between rounded-2xl bg-[#5865F2] px-3.5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-16px_rgba(88,101,242,1)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#6571f4] hover:shadow-[0_16px_34px_-15px_rgba(88,101,242,1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5865F2]/25"
            >
              <span className="flex items-center gap-2.5">
                <DiscordLogo className="h-[17px] w-[22px] text-white" />
                <span>{t("discord")}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-white/75 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
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
        className="group relative flex h-14 w-14 items-center overflow-hidden rounded-[1.15rem] border border-white/15 bg-[#5865F2] text-white shadow-[0_14px_38px_-16px_rgba(88,101,242,0.95)] transition-[width,transform,box-shadow,background-color] duration-200 hover:-translate-y-1 hover:bg-[#6470f4] hover:shadow-[0_20px_44px_-15px_rgba(88,101,242,1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5865F2]/25 sm:w-[10.5rem]"
      >
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.12),transparent_35%,transparent_65%,rgba(255,255,255,0.06))]" />

        <span className="relative grid h-14 w-14 shrink-0 place-items-center text-white">
          <DiscordLogo className="h-[24px] w-[31px]" />
          {hasOnline && (
            <span className="absolute bottom-[9px] right-[8px] h-2.5 w-2.5 rounded-full border-2 border-[#5865F2] bg-emerald-400" />
          )}
        </span>

        <span className="relative hidden min-w-0 flex-1 pr-3 text-left sm:block">
          <span className="block truncate text-[12px] font-semibold leading-tight tracking-[-0.01em]">Discord</span>
          <span className="mt-0.5 block truncate text-[9px] font-medium text-white/65">
            {data?.presence_count != null ? `${online} ${t("onlineMembers").toLowerCase()}` : "TFLives Community"}
          </span>
        </span>
      </button>
    </div>
  );
}
