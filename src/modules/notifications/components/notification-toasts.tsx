"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getNotificationHref } from "@/modules/notifications/links";
import { subscribeToNotificationToasts, type NotificationToast } from "@/modules/notifications/toast-store";

const AUTO_DISMISS_MS = 6000;

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

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => {
        const href = getNotificationHref({
          type: toast.type,
          entityType: toast.entityType,
          entityId: toast.entityId,
          actor: null,
        });
        const body = (
          <>
            <p className="text-sm text-foreground">
              {toast.actorName ? `${toast.actorName} — ` : ""}
              {t(`message.${toast.type}`)}
            </p>
          </>
        );

        return (
          <div
            key={toast.id}
            className="relative rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-xl shadow-black/10 p-3 pr-8 animate-in fade-in-0 slide-in-from-top-2 duration-200"
          >
            <button
              onClick={() => dismiss(toast.id)}
              aria-label={t("cerrar")}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {href ? (
              <Link href={href} onClick={() => dismiss(toast.id)} className="block hover:opacity-80 transition-opacity">
                {body}
              </Link>
            ) : (
              body
            )}
          </div>
        );
      })}
    </div>
  );
}
