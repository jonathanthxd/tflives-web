"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, MessageCircle, Radio, Users, X } from "lucide-react";

interface Counts {
  member_count: number | null;
  presence_count: number | null;
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

  return (
    <div
      className="fixed left-3 z-40 sm:left-5"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      {open && (
        <section className="absolute bottom-[calc(100%+0.75rem)] left-0 w-[min(19rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[#5865F2]/30 bg-card/95 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="relative overflow-hidden border-b border-border/80 px-4 py-4">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#5865F2]/18 via-transparent to-primary/10" />
            <div className="relative flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/25">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold text-foreground">TFLives Discord</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t("communityDescription")}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("cancel")}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="rounded-xl border border-border/80 bg-background/35 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{t("members")}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{members}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/35 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                <Radio className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{t("onlineMembers")}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{online}</p>
            </div>
          </div>

          <div className="px-3 pb-3">
            <a
              href="https://discord.com/invite/c3jFPyJ9vd"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#5865F2]/20 transition-transform hover:-translate-y-0.5 hover:bg-[#6370F4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5865F2]/25"
            >
              {t("discord")}
              <ExternalLink className="h-3.5 w-3.5" />
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
        className="group flex h-14 w-14 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/15 bg-[#5865F2] px-0 text-white shadow-xl shadow-[#5865F2]/20 transition-[width,transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#6370F4] hover:shadow-2xl hover:shadow-[#5865F2]/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5865F2]/25 sm:w-40 sm:justify-start sm:px-3"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
          <MessageCircle className="h-5 w-5" />
          {data?.presence_count != null && data.presence_count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#5865F2] bg-emerald-400" />
          )}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-xs font-semibold leading-tight">Discord</span>
          <span className="mt-0.5 block truncate text-[10px] text-white/75">
            {data?.presence_count != null ? `${online} ${t("onlineMembers").toLowerCase()}` : t("discord")}
          </span>
        </span>
      </button>
    </div>
  );
}
