"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getNotificationHref } from "@/modules/notifications/links";
import { subscribeToNotificationToasts, type NotificationToast } from "@/modules/notifications/toast-store";

const AUTO_DISMISS_MS = 6000;

const ICONS: Record<string, string> = {
  FRIEND_REQUEST:
    "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-16.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  FRIEND_ACCEPTED:
    "M4.5 12.75l6 6 9-13.5",
  POST_PUBLISHED:
    "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  MESSAGE:
    "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
  LEVEL_UP:
    "M12 2.25l2.514 5.093 5.621.817-4.067 3.965.96 5.6L12 15.08l-5.028 2.645.96-5.6L3.865 8.16l5.621-.817L12 2.25z",
  DEFAULT:
    "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
};

export default function NotificationToasts() {
  const t = useTranslations("Notifications");
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  useEffect(() => {
    return subscribeToNotificationToasts((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, AUTO_DISMISS_MS);
    });
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="fixed top-28 sm:top-32 right-4 sm:right-6 z-[60] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const href = getNotificationHref({
            type: toast.type,
            entityType: toast.entityType,
            entityId: toast.entityId,
            actor: null,
          });
          const icon = ICONS[toast.type] ?? ICONS.DEFAULT;

          const body = (
            <p className="text-sm text-foreground leading-snug">
              {toast.type === "ANNOUNCEMENT" && toast.announcementTitle ? (
                <span className="font-semibold">{toast.announcementTitle}</span>
              ) : (
                <>
                  {toast.actorName && <span className="font-semibold">{toast.actorName} </span>}
                  {t(`message.${toast.type}`)}
                </>
              )}
            </p>
          );

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2, ease: "easeIn" } }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="pointer-events-auto relative overflow-hidden rounded-2xl border border-primary/15 bg-card/95 backdrop-blur-xl shadow-xl shadow-black/20"
            >
              <div className="flex items-start gap-3 p-3.5 pr-9">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  {href ? (
                    <Link
                      href={href}
                      onClick={() => dismiss(toast.id)}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </div>
              </div>

              <button
                onClick={() => dismiss(toast.id)}
                aria-label={t("cerrar")}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
                className="h-0.5 origin-left bg-primary/50"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
