"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MessageSquare, Heart, ArrowUpRight, Sparkles } from "lucide-react";
import { Card } from "@/shared/ui/card";
import type { ActivityItem } from "@/modules/community/activity";

export default function RecentActivity({ username, embedded = false }: { username: string; embedded?: boolean }) {
  const t = useTranslations("ProfilePlaceholders");
  const [items, setItems] = useState<ActivityItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/community/activity?username=${encodeURIComponent(username)}`, { cache: "no-store" })
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

  const content = (
    <section aria-label={t("actividadReciente")}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
          {t("actividadReciente")}
        </h2>
      </div>

      {items === null && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-primary/5" />
          ))}
        </div>
      )}

      {items !== null && items.length === 0 && (
        <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/10 px-5 py-6 text-center">
          <Sparkles className="mb-3 size-6 text-primary/45" strokeWidth={1.5} aria-hidden="true" />
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">{t("sinActividadCta")}</p>
          <Link
            href="/network"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition hover:underline"
          >
            {t("explorarNetwork")}
            <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      )}

      {items !== null && items.length > 0 && (
        <div className="max-h-72 overflow-y-auto pr-2 [scrollbar-width:thin]">
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li
                key={`${item.type}-${item.id}`}
                className="group relative border-l border-border/60 pb-4 pl-6 last:border-transparent last:pb-0 animate-rise-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span
                  className={`absolute -left-[7px] top-0.5 flex size-3.5 items-center justify-center rounded-full ${
                    item.type === "COMMENT" ? "bg-primary/15 text-primary" : "bg-rose-500/15 text-rose-500"
                  }`}
                >
                  {item.type === "COMMENT" ? (
                    <MessageSquare className="size-2" strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <Heart className="size-2" strokeWidth={3} fill="currentColor" aria-hidden="true" />
                  )}
                </span>

                <Link
                  href={`/network/${item.postSlug}`}
                  className="-mx-2 block rounded-xl px-2 py-1.5 transition-colors duration-200 hover:bg-primary/5"
                >
                  <p className="text-xs text-muted-foreground">
                    {item.type === "COMMENT" ? t("comento") : t("leGusto")} {" "}
                    <span className="font-medium text-foreground">{item.postTitle}</span>
                  </p>
                  {item.excerpt && (
                    <p className="mt-1 line-clamp-2 text-sm text-foreground/80">{item.excerpt}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );

  return embedded ? content : <Card className="p-5 sm:p-6">{content}</Card>;
}
