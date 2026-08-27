"use client";

import { Role } from "@prisma/client";
import { ArrowLeft, Circle } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { ADMIN_NAV_GROUPS, canAccessSection } from "@/modules/administration/permissions";
import { SECTION_ICONS, PLACEHOLDER_ICONS } from "@/modules/administration/components/ui/icons";

export default function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-full w-64 overflow-y-auto border-r border-primary/10 bg-background/95 backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="relative p-6 pt-24">
        <Link href="/" className="font-display text-xl font-bold">
          <span className="text-foreground">TFL</span>
          <span className="text-primary">ives</span>
        </Link>
        <div className="mt-2.5 flex items-center gap-1.5">
          <Circle className="h-1.5 w-1.5 fill-primary text-primary" />
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground/60">
            {role === "ADMIN" ? "Admin console" : "Panel de moderación"}
          </p>
        </div>
      </div>

      <nav className="relative space-y-7 px-3 pb-6">
        {ADMIN_NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => canAccessSection(role, item.section));
          if (visibleItems.length === 0 && !group.placeholders?.length) return null;

          return (
            <div key={group.title}>
              <p className="mb-1.5 px-3 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = SECTION_ICONS[item.section];
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-start gap-3 rounded-lg py-2.5 pl-3 pr-3 text-sm transition-colors duration-200 ${
                        isActive
                          ? "bg-primary/[0.08] text-foreground"
                          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary transition-opacity duration-200 ${
                          isActive ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <Icon
                        className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary/70"}`}
                        strokeWidth={1.75}
                      />
                      <span className="min-w-0">
                        <span className={`block truncate font-medium ${isActive ? "text-foreground" : ""}`}>
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="mt-0.5 block truncate text-[11px] leading-snug text-muted-foreground/50">
                            {item.description}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}

                {group.placeholders?.map((item) => {
                  const Icon = PLACEHOLDER_ICONS[item.iconKey];
                  return (
                    <div
                      key={item.label}
                      title="Próximamente"
                      className="flex cursor-not-allowed items-center gap-3 rounded-lg py-2.5 pl-3 pr-3 text-sm text-muted-foreground/35"
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <span className="shrink-0 rounded border border-current/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider">
                        Soon
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="relative px-6 pb-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Volver al sitio
        </Link>
      </div>
    </aside>
  );
}
