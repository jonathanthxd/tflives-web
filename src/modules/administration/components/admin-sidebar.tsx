"use client";

import { useEffect, useState } from "react";
import { Role } from "@prisma/client";
import { ArrowLeft, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ADMIN_NAV_GROUPS, canAccessSection } from "@/modules/administration/permissions";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export default function AdminSidebar({
  role,
  open,
  onClose,
}: {
  role: Role;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("AdminPlatform");
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);
  const drawerVisible = desktop || open;

  return (
    <>
      <button
        type="button"
        aria-label={t("closeNavigation")}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-foreground/25 backdrop-blur-[1px] transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        aria-label={t("navigation")}
        aria-hidden={!drawerVisible}
        inert={!drawerVisible}
        className={`tfl-glass tfl-glass-strong fixed inset-y-0 left-0 z-40 flex w-[min(18rem,calc(100vw-2.5rem))] flex-col overflow-y-auto border-r border-primary/10 transition-transform duration-200 lg:w-64 lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="relative flex items-start justify-between px-6 pb-5 pt-6 lg:pt-8">
          <div>
            <Link href="/" onClick={onClose} className="font-display text-xl font-bold">
              <span className="text-foreground">TFL</span><span className="text-primary">ives</span>
            </Link>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
              {role === "ADMIN" ? t("adminConsole") : t("moderationConsole")}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-foreground lg:hidden" aria-label={t("closeNavigation")}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="relative flex-1 space-y-6 px-3 pb-6">
          {ADMIN_NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => canAccessSection(role, item.section));
            if (!visibleItems.length) return null;
            return (
              <div key={group.title}>
                <p className="mb-1.5 px-3 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/45">{t(group.title)}</p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = SECTION_ICONS[item.section];
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        aria-current={isActive ? "page" : undefined}
                        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive ? "bg-primary/[0.08] text-foreground" : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"}`}
                      >
                        <span className={`absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary ${isActive ? "opacity-100" : "opacity-0"}`} />
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary"}`} strokeWidth={1.75} />
                        <span className="truncate font-medium">{t(item.label)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-primary/10 p-4">
          <Link href="/" onClick={onClose} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            {t("backToSite")}
          </Link>
        </div>
      </aside>
    </>
  );
}
