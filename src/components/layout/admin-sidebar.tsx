"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <aside className="fixed left-0 top-0 h-full w-64 bg-tfl-night/95 backdrop-blur-xl border-r border-tfl-sky/10 z-40">
      <div className="p-6">
        <Link href="/" className="font-display text-xl font-bold">
          <span className="text-tfl-bone">TFL</span>
          <span className="text-tfl-sky">ives</span>
        </Link>
        <p className="text-xs text-tfl-stone/50 mt-1 uppercase tracking-wider">Panel Admin</p>
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
                  ? "bg-tfl-sky/10 text-tfl-sky border border-tfl-sky/20"
                  : "text-tfl-stone hover:bg-tfl-sky/5 hover:text-tfl-bone border border-transparent"
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
          className="flex items-center gap-2 px-4 py-3 text-sm text-tfl-stone hover:text-tfl-bone transition-colors"
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