"use client";

import { useEffect, useRef, useState } from "react";
import { Gauge } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PublicProgress } from "@/modules/progression/level";
import { Card } from "@/shared/ui/card";

const REFRESH_MS = 10_000;

export default function LiveProgressCard({
  username,
  initialProgress,
  embedded = false,
}: {
  username: string;
  initialProgress: PublicProgress;
  embedded?: boolean;
}) {
  const t = useTranslations("Profile");
  const rootRef = useRef<HTMLElement>(null);
  const [live, setLive] = useState<{ username: string; initial: PublicProgress; progress: PublicProgress } | null>(null);
  const progress = live?.username === username && live.initial === initialProgress ? live.progress : initialProgress;

  useEffect(() => {
    let visible = true;
    let cancelled = false;
    let request: AbortController | null = null;
    const run = async () => {
      if (cancelled || !visible || document.hidden || request) return;
      const controller = new AbortController();
      request = controller;
      try {
        const response = await fetch(`/api/profile/progress?username=${encodeURIComponent(username)}`, {
          cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && !controller.signal.aborted && data?.progress)
          setLive({ username, initial: initialProgress, progress: data.progress as PublicProgress });
      } catch {
        // Keep the server-rendered identity and last progress during interruptions.
      } finally { if (request === controller) request = null; }
    };
    const interval = window.setInterval(run, REFRESH_MS);
    const onVisibility = () => {
      if (document.hidden) request?.abort();
      else void run();
    };
    const observer = new IntersectionObserver(([entry]) => {
      const previous = visible;
      visible = entry.isIntersecting;
      if (!visible) request?.abort();
      else if (!previous) void run();
    });
    if (rootRef.current) observer.observe(rootRef.current);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      request?.abort();
      observer.disconnect();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [initialProgress, username]);

  const content = (
    <section ref={rootRef} aria-label={t("progression")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">{t("progression")}</h2>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
          {t("level", { level: progress.level })}
        </span>
      </div>
      <div className="mt-4">
        <div
          role="progressbar"
          aria-label={t("progressBar", { level: progress.level })}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress.progressPercent)}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{t("xpToNext", { xp: progress.xp, nextXp: progress.nextLevelXp })}</span>
          <span className="shrink-0 font-mono text-[11px] text-primary/75">{Math.round(progress.progressPercent)}%</span>
        </div>
      </div>
    </section>
  );

  return embedded ? content : <Card className="p-5 sm:p-6">{content}</Card>;
}
