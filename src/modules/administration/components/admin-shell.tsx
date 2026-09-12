"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import AdminSidebar from "@/modules/administration/components/admin-sidebar";
import { AdminGlobalSearch } from "@/modules/administration/components/admin-global-search";

export function AdminShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = useTranslations("AdminPlatform");
  return (
    <div className="content-surface relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-96" style={{ background: "radial-gradient(60rem 24rem at 70% -10%, hsl(var(--primary) / 0.08), transparent 70%)" }} />
      <AdminSidebar role={role} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="relative z-10 min-w-0 lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-primary/10 bg-background/85 px-4 py-3 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <button type="button" onClick={() => setDrawerOpen(true)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-primary/10 hover:text-foreground lg:hidden" aria-label={t("openNavigation")}><Menu className="h-4 w-4" /></button>
            <div className="hidden min-w-0 flex-1 sm:block"><p className="truncate font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">{t("adminArea")}</p></div>
            <AdminGlobalSearch />
          </div>
        </header>
        <main className="min-w-0 px-4 pb-16 pt-8 sm:px-8"><div className="mx-auto max-w-6xl">{children}</div></main>
      </div>
    </div>
  );
}
