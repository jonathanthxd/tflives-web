"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LockKeyhole, Sparkles, Trophy } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { ACHIEVEMENT_ICONS } from "@/modules/administration/components/ui/icons";

interface EarnedAchievement {
  id: string;
  awardedAt: string;
  achievement: {
    id: string;
    name: string;
    description: string;
    iconKey: string;
  };
}

interface ObtainableAchievement {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  trigger: string | null;
  triggerValue: number | null;
  unlockedAt: string | null;
}

interface ProgressionAchievement {
  code: string;
  category: string;
  iconKey: string;
  unlockedAt: string | null;
}

interface ProgressionData {
  achievements: ProgressionAchievement[];
}

interface AchievementsResponse {
  achievements: EarnedAchievement[];
  obtainableAchievements: ObtainableAchievement[];
  progression: ProgressionData;
}

const EMPTY_DATA: AchievementsResponse = {
  achievements: [],
  obtainableAchievements: [],
  progression: { achievements: [] },
};

function normalizedResponse(response: Partial<AchievementsResponse>): AchievementsResponse {
  return {
    achievements: response.achievements ?? [],
    obtainableAchievements: response.obtainableAchievements ?? [],
    progression: response.progression ?? { achievements: [] },
  };
}

export default function AchievementsCard({ username }: { username: string }) {
  const t = useTranslations("Progression");
  const locale = useLocale();
  const [data, setData] = useState<AchievementsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/achievements/user?username=${encodeURIComponent(username)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : EMPTY_DATA))
      .then((response) => {
        if (!cancelled) setData(normalizedResponse(response));
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY_DATA);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
            {t("achievementsTitle")}
          </h2>
        </div>
        {data && (
          <span className="font-mono text-xs text-muted-foreground">
            {data.progression.achievements.filter((achievement) => achievement.unlockedAt).length}/
            {data.progression.achievements.length}
          </span>
        )}
      </div>

      {data === null && (
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 w-10 animate-pulse rounded-full bg-primary/5" />
          ))}
        </div>
      )}

      {data !== null && (
        <div className="space-y-2">
          {data.progression.achievements.map((item) => {
            const Icon = ACHIEVEMENT_ICONS[item.iconKey] ?? Trophy;
            const unlocked = Boolean(item.unlockedAt);
            return (
              <article
                key={item.code}
                tabIndex={0}
                className={`flex gap-3 rounded-xl border p-3 outline-none transition focus-visible:ring-2 focus-visible:ring-primary/60 ${
                  unlocked ? "border-primary/20 bg-primary/5" : "border-border bg-muted/20 opacity-75"
                }`}
              >
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${unlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium text-foreground">{t(`achievements.${item.code}.title`)}</span>
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{t(`category.${item.category}`)}</span>
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{t(`achievements.${item.code}.description`)}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {unlocked
                      ? t("unlockedOn", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(item.unlockedAt!)) })
                      : t("locked")}
                  </span>
                </span>
              </article>
            );
          })}

          {data.obtainableAchievements.length > 0 && (
            <div className="border-t border-border pt-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                <p className="text-xs font-medium text-muted-foreground">{t("obtainableAchievements")}</p>
              </div>
              <div className="space-y-2">
                {data.obtainableAchievements.map((item) => {
                  const Icon = ACHIEVEMENT_ICONS[item.iconKey] ?? Trophy;
                  const unlocked = Boolean(item.unlockedAt);
                  return (
                    <article
                      key={item.id}
                      className={`flex gap-3 rounded-xl border p-3 ${
                        unlocked ? "border-primary/20 bg-primary/5" : "border-border bg-muted/15"
                      }`}
                    >
                      <span className={`relative flex size-9 shrink-0 items-center justify-center rounded-full ${unlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="size-4" aria-hidden="true" />
                        {!unlocked && <LockKeyhole className="absolute -bottom-1 -right-1 size-3 rounded-full bg-card p-0.5" aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-primary/80">
                            {t("automaticGoal")}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.description}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {unlocked
                            ? t("unlockedOn", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(item.unlockedAt!)) })
                            : t("locked")}
                        </span>
                      </span>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {data.achievements.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">{t("communityBadges")}</p>
              <div className="flex flex-wrap gap-2">
                {data.achievements.map((item) => {
                  const Icon = ACHIEVEMENT_ICONS[item.achievement.iconKey] ?? Trophy;
                  return (
                    <span
                      key={item.id}
                      title={`${item.achievement.name} — ${item.achievement.description}`}
                      className="flex size-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary"
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      <span className="sr-only">{item.achievement.name}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
