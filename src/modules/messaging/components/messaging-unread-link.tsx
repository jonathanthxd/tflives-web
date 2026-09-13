"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function MessagingUnreadLink({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("Navbar");
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/messaging/unread", { cache: "no-store" });
      if (response.ok) setUnread((await response.json()).unreadCount || 0);
    } catch {
      // A transient badge failure does not affect access to messages.
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 20_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  return (
    <Link
      href="/mensajes"
      title={t("mensajes")}
      aria-label={t("mensajes")}
      className={`relative hidden size-10 items-center justify-center text-muted-foreground transition-[color,background-color,border-radius] duration-300 hover:bg-primary/[0.08] hover:text-primary sm:inline-flex ${compact ? "rounded-full" : "rounded-xl"}`}
    >
      <MessageCircle className="size-5" strokeWidth={1.6} />
      {unread > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-background bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
