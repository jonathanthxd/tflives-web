"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Trophy } from "lucide-react";
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

export default function AchievementsCard({ username }: { username: string }) {
  const t = useTranslations("ProfilePlaceholders");
  const [items, setItems] = useState<EarnedAchievement[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/achievements/user?username=${encodeURIComponent(username)}`)
      .then((res) => (res.ok ? res.json() : { achievements: [] }))
      .then((data) => {
        if (!cancelled) setItems(data.achievements ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  return (
    <Card className="p-6 h-full">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">
            {t("logros")}
          </h2>
        </div>
        {items && items.length > 0 && (
          <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
        )}
      </div>

      {items === null && (
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 w-10 rounded-full bg-primary/5 animate-pulse" />
          ))}
        </div>
      )}

      {items !== null && items.length === 0 && (
        <p className="text-xs text-muted-foreground leading-relaxed">{t("sinLogros")}</p>
      )}

      {items !== null && items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const Icon = ACHIEVEMENT_ICONS[item.achievement.iconKey] ?? Trophy;
            return (
              <div
                key={item.id}
                title={`${item.achievement.name} — ${item.achievement.description}`}
                className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-6px_hsl(var(--primary)/0.5)]"
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
