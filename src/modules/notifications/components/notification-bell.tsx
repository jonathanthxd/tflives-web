"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Megaphone, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getNotificationHref } from "@/modules/notifications/links";
import { publishNotificationToast } from "@/modules/notifications/toast-store";
import { UserAvatar } from "@/modules/profiles/components/user-identity";
import { formatUserDateTime } from "@/shared/lib/date-time";

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

export default function NotificationBell({ userId, compact = false }: { userId: string; compact?: boolean }) {
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
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, boolean> = {};
        for (const preference of data.preferences || []) map[preference.category] = preference.browserEnabled;
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
        // A transient network issue should not break the notification center.
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
    if (Notification.permission === "default") await Notification.requestPermission();
  }

  async function markAllRead() {
    setItems((previous) => previous.map((notification) => ({ ...notification, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
  }

  async function markRead(id: string) {
    setItems((previous) => previous.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)));
    setUnreadCount((count) => Math.max(0, count - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  function toggleOpen() {
    setOpen((value) => !value);
    if (!open) requestPermissionIfNeeded();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggleOpen}
        title={t("titulo")}
        aria-label={t("titulo")}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`relative hidden size-10 items-center justify-center text-muted-foreground transition-[color,background-color,border-radius] duration-300 hover:bg-primary/[0.08] hover:text-primary sm:inline-flex ${compact ? "rounded-full" : "rounded-xl"}`}
      >
        <Bell className="size-5" strokeWidth={1.6} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-background bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t("titulo")}
          className="absolute right-0 z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-2xl shadow-black/15 backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Bell className="size-4" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("titulo")}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {unreadCount > 0 ? t("pendientes", { count: unreadCount }) : t("todoAlDia")}
                  </p>
                </div>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/[0.08]"
              >
                <CheckCheck className="size-3.5" />
                <span className="hidden sm:inline">{t("marcarTodoLeido")}</span>
              </button>
            )}
          </div>

          <div className="max-h-[min(30rem,calc(100dvh-8rem))] overflow-y-auto p-2">
            {items.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-primary/[0.08] text-primary">
                  <Sparkles className="size-5" strokeWidth={1.6} />
                </span>
                <p className="text-sm font-medium text-foreground">{t("sinNotificacionesTitulo")}</p>
                <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-muted-foreground">{t("sinNotificaciones")}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {items.map((notification) => {
                  const href = getNotificationHref(notification);
                  const name = actorName(notification.actor);
                  const itemClassName = `group relative flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    notification.read ? "hover:bg-muted/45" : "bg-primary/[0.055] hover:bg-primary/[0.09]"
                  }`;
                  const visual = notification.actor ? (
                    <UserAvatar
                      identity={notification.actor}
                      className="mt-0.5 size-9 text-xs"
                      alt={name || t("titulo")}
                    />
                  ) : (
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      {notification.type === "ANNOUNCEMENT" ? <Megaphone className="size-4" /> : <Bell className="size-4" />}
                    </span>
                  );
                  const content = (
                    <>
                      {visual}
                      <span className="min-w-0 flex-1">
                        {notification.type === "ANNOUNCEMENT" && notification.announcement ? (
                          <>
                            <span className="block truncate text-sm font-medium text-foreground">{notification.announcement.title}</span>
                            <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-muted-foreground">{notification.announcement.body}</span>
                          </>
                        ) : (
                          <span className="block text-sm leading-snug text-foreground/90">
                            {name && <strong className="font-semibold text-foreground">{name} </strong>}
                            {t(`message.${notification.type}`)}
                          </span>
                        )}
                        <span className="mt-1.5 block text-[11px] text-muted-foreground/70">{formatUserDateTime(notification.createdAt, locale)}</span>
                      </span>
                      {!notification.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)]" aria-label={t("noLeida")} />}
                    </>
                  );

                  if (href) {
                    return (
                      <Link
                        key={notification.id}
                        href={href}
                        role="menuitem"
                        onClick={() => {
                          if (!notification.read) markRead(notification.id);
                          setOpen(false);
                        }}
                        className={itemClassName}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={notification.id}
                      role="menuitem"
                      onClick={() => !notification.read && markRead(notification.id)}
                      className={itemClassName}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
