"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [live, setLive] = useState<{ username: string; initial: PublicProgress; progress: PublicProgress } | null>(null);
  const progress = live?.username === username && live.initial === initialProgress ? live.progress : initialProgress;

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/profile/progress?username=${encodeURIComponent(username)}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.progress) setLive({ username, initial: initialProgress, progress: data.progress as PublicProgress });
    } catch {
      // Keep the last known progress on temporary network failures.
    }
  }, [initialProgress, username]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await refresh();
    };
    const interval = window.setInterval(run, REFRESH_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void run();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  const content = (
    <section aria-label={t("progression")}>
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
