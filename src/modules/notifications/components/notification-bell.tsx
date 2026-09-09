"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getNotificationHref } from "@/modules/notifications/links";
import { publishNotificationToast } from "@/modules/notifications/toast-store";

interface Actor {
  id: string;
  displayName: string | null;
  name: string | null;
  username: string | null;
  image: string | null;
}

interface NotificationItem {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  entityType: string | null;
  entityId: string | null;
  actor: Actor | null;
  announcement: { id: string; title: string; body: string } | null;
}

function actorName(actor: Actor | null) {
  if (!actor) return null;
  return actor.displayName || actor.name || actor.username || "Alguien";
}

export default function NotificationBell({ userId }: { userId: string }) {
  const t = useTranslations("Notifications");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const preferencesRef = useRef<Record<string, boolean>>({});
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadedRef = useRef(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, boolean> = {};
        for (const p of data.preferences || []) map[p.category] = p.browserEnabled;
        preferencesRef.current = map;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshNotifications() {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const fresh: NotificationItem[] = data.notifications || [];
        const previousIds = knownIdsRef.current;

        if (initialLoadedRef.current) {
          for (const notification of fresh) {
            if (previousIds.has(notification.id)) continue;

            publishNotificationToast({
              id: notification.id,
              type: notification.type,
              actorName: actorName(notification.actor),
              entityType: notification.entityType,
              entityId: notification.entityId,
              announcementTitle: notification.announcement?.title ?? null,
            });

            if (
              typeof Notification !== "undefined" &&
              Notification.permission === "granted" &&
              preferencesRef.current[notification.type] !== false
            ) {
              new Notification("TFLives", { body: t(`message.${notification.type}`) });
            }
          }
        }

        knownIdsRef.current = new Set(fresh.map((notification) => notification.id));
        initialLoadedRef.current = true;
        setItems(fresh);
        setUnreadCount(data.unreadCount || 0);
      } catch {
        // Un fallo puntual de red no rompe el centro de notificaciones.
      }
    }

    refreshNotifications();
    const interval = window.setInterval(refreshNotifications, 10_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshNotifications();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId, t]);

  async function requestPermissionIfNeeded() {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
  }

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  function toggleOpen() {
    setOpen((v) => !v);
    if (!open) requestPermissionIfNeeded();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggleOpen}
        title={t("titulo")}
        aria-label={t("titulo")}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 hidden sm:inline-flex"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-xl shadow-black/10 p-1.5 z-50 origin-top-right animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-semibold text-foreground">{t("titulo")}</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                {t("marcarTodoLeido")}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t("sinNotificaciones")}</p>
          ) : (
            items.map((n) => {
              const href = getNotificationHref(n);
              const itemClassName = `flex w-full flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                n.read ? "text-muted-foreground hover:bg-primary/5" : "text-foreground bg-primary/5 hover:bg-primary/10"
              }`;
              const content =
                n.type === "ANNOUNCEMENT" && n.announcement ? (
                  <>
                    <span className="font-medium">{n.announcement.title}</span>
                    <span className="text-xs text-muted-foreground/80 line-clamp-2">{n.announcement.body}</span>
                    <span className="text-xs text-muted-foreground/60">
                      {new Date(n.createdAt).toLocaleString(locale)}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {actorName(n.actor) ? `${actorName(n.actor)} — ` : ""}
                      {t(`message.${n.type}`)}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      {new Date(n.createdAt).toLocaleString(locale)}
                    </span>
                  </>
                );

              if (href) {
                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => {
                      if (!n.read) markRead(n.id);
                      setOpen(false);
                    }}
                    className={itemClassName}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button key={n.id} onClick={() => !n.read && markRead(n.id)} className={itemClassName}>
                  {content}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
