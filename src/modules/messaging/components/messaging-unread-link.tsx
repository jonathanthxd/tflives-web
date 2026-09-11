"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MessageCircle } from "lucide-react";

export default function MessagingUnreadLink() {
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
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); };
  }, [refresh]);
  return (
    <Link href="/mensajes" title={t("mensajes")} className="relative p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 hidden sm:inline-flex">
      <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
      {unread > 0 && <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{unread > 9 ? "9+" : unread}</span>}
    </Link>
  );
}
