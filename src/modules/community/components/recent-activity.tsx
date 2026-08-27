"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MessageSquare, Heart, ArrowUpRight, Sparkles } from "lucide-react";
import { Card } from "@/shared/ui/card";
import type { ActivityItem } from "@/modules/community/activity";

export default function RecentActivity({ username }: { username: string }) {
  const t = useTranslations("ProfilePlaceholders");
  const [items, setItems] = useState<ActivityItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/community/activity?username=${encodeURIComponent(username)}`)
      .then((res) => (res.ok ? res.json() : { activity: [] }))
      .then((data) => {
        if (!cancelled) setItems(data.activity ?? []);
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">
          {t("actividadReciente")}
        </h2>
      </div>

      {items === null && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-primary/5 animate-pulse" />
          ))}
        </div>
      )}

      {items !== null && items.length === 0 && (
        <div className="flex flex-col items-center text-center py-8">
          <Sparkles className="h-6 w-6 text-primary/50 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground max-w-xs">{t("sinActividadCta")}</p>
          <Link
            href="/network"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {t("explorarNetwork")}
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
      )}

      {items !== null && items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li
              key={`${item.type}-${item.id}`}
              className="group relative pl-6 pb-4 last:pb-0 border-l border-border/60 last:border-transparent animate-rise-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                className={`absolute -left-[7px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                  item.type === "COMMENT" ? "bg-primary/15 text-primary" : "bg-rose-500/15 text-rose-500"
                }`}
              >
                {item.type === "COMMENT" ? (
                  <MessageSquare className="h-2 w-2" strokeWidth={3} />
                ) : (
                  <Heart className="h-2 w-2" strokeWidth={3} fill="currentColor" />
                )}
              </span>

              <Link
                href={`/network/${item.postSlug}`}
                className="block rounded-xl -mx-2 px-2 py-1.5 transition-colors duration-200 hover:bg-primary/5"
              >
                <p className="text-xs text-muted-foreground">
                  {item.type === "COMMENT" ? t("comento") : t("leGusto")}{" "}
                  <span className="font-medium text-foreground">{item.postTitle}</span>
                </p>
                {item.excerpt && (
                  <p className="mt-1 text-sm text-foreground/80 line-clamp-2">{item.excerpt}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
