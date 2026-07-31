"use client";

import { Link, usePathname } from "@/i18n/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/posts", label: "Posts", icon: "📝" },
  { href: "/admin/modalities", label: "Modalidades", icon: "🎮" },
  { href: "/admin/users", label: "Usuarios", icon: "👥" },
  { href: "/admin/owners", label: "Owners", icon: "🏆" },
  { href: "/admin/chat", label: "Chat Moderación", icon: "💬" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-background/95 backdrop-blur-xl border-r border-primary/10 z-40">
      <div className="p-6">
        <Link href="/" className="font-display text-xl font-bold">
          <span className="text-foreground">TFL</span>
          <span className="text-primary">ives</span>
        </Link>
        <p className="text-xs text-muted-foreground/50 mt-1 uppercase tracking-wider">Panel Admin</p>
      </div>

      <nav className="px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-foreground border border-transparent"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-6 right-6">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al sitio
        </Link>
      </div>
    </aside>
  );
}