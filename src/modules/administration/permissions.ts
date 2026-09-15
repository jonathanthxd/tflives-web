import { Role } from "@prisma/client";

/**
 * Secciones reales del panel admin (con sistema de datos detrás). Las
 * Each listed section has a corresponding server-side page/API guard.
 */
export const ADMIN_SECTIONS = [
  "dashboard",
  "posts",
  "wiki",
  "timeline",
  "modalities",
  "users",
  "reports",
  "chat",
  "moderation",
  "staffLog",
  "analytics",
  "announcements",
  "team",
  "achievements",
  "wallet",
  "cosmetics",
  "creators",
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];

/**
 * Quién puede entrar a cada sección. MOD modera (reportes, sanciones,
 * contenido) pero no toca roles de otros usuarios ni configuración de
 * modalidades — eso es ADMIN-only.
 */
export const SECTION_ACCESS: Record<AdminSection, Role[]> = {
  dashboard: ["MOD", "ADMIN"],
  posts: ["MOD", "ADMIN"],
  wiki: ["MOD", "ADMIN"],
  timeline: ["ADMIN"],
  modalities: ["ADMIN"],
  users: ["ADMIN"],
  reports: ["MOD", "ADMIN"],
  chat: ["MOD", "ADMIN"],
  moderation: ["MOD", "ADMIN"],
  staffLog: ["ADMIN"],
  analytics: ["ADMIN"],
  announcements: ["ADMIN"],
  team: ["ADMIN"],
  achievements: ["ADMIN"],
  wallet: ["ADMIN"],
  cosmetics: ["ADMIN"],
  creators: ["ADMIN"],
};

export function canAccessSection(role: Role, section: AdminSection): boolean {
  return SECTION_ACCESS[section].includes(role);
}

/** Puede entrar al panel admin en general (aunque no a todas las secciones). */
export function canAccessAdminPanel(role: Role): boolean {
  return role === "MOD" || role === "ADMIN";
}

/** Reusable server-side capability helpers for the roles that exist today. */
export function canModerate(role: Role): boolean {
  return role === "MOD" || role === "ADMIN";
}

export function canManageContent(role: Role): boolean {
  return canModerate(role);
}

export function canManageUsers(role: Role): boolean {
  return role === "ADMIN";
}

export function canManageSecurity(role: Role): boolean {
  return role === "ADMIN";
}

/**
 * Acciones de moderación puntuales (además del gate de sección). Cambiar el
 * rol de otro usuario y desbanear son siempre ADMIN-only, sin importar la
 * sección desde la que se dispare la acción.
 */
export function canChangeRoles(role: Role): boolean {
  return canManageUsers(role);
}

export function canManageSanctions(role: Role): boolean {
  return canModerate(role);
}

export interface AdminNavItem {
  section: AdminSection;
  href: string;
  /** Translation key in the AdminPlatform namespace. */
  label: string;
}

export interface AdminPlaceholderItem {
  label: string;
  /** Clave para PLACEHOLDER_ICONS en components/ui/icons.tsx */
  iconKey: string;
}

export interface AdminNavGroup {
  /** Translation key in the AdminPlatform namespace. */
  title: string;
  items: AdminNavItem[];
}

/**
 * Navigation stays declarative so the shell can hide unavailable specialist
 * tools without treating client-side visibility as authorization.
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: "navOverview",
    items: [
      { section: "dashboard", href: "/admin", label: "navDashboard" },
    ],
  },
  {
    title: "navCommunity",
    items: [
      { section: "users", href: "/admin/users", label: "navUsers" },
      { section: "reports", href: "/admin/reports", label: "navReports" },
      { section: "chat", href: "/admin/chat", label: "navChat" },
      { section: "moderation", href: "/admin/moderation", label: "navModeration" },
      { section: "creators", href: "/admin/creators", label: "navCreators" },
      { section: "team", href: "/admin/team", label: "navTeam" },
    ],
  },
  {
    title: "navContent",
    items: [
      { section: "posts", href: "/admin/posts", label: "navPosts" },
      { section: "wiki", href: "/admin/wiki", label: "navWiki" },
      { section: "timeline", href: "/admin/timeline", label: "navTimeline" },
      { section: "announcements", href: "/admin/announcements", label: "navAnnouncements" },
      { section: "modalities", href: "/admin/modalities", label: "navModalities" },
    ],
  },
  {
    title: "navProgression",
    items: [
      { section: "achievements", href: "/admin/achievements", label: "navAchievements" },
      { section: "wallet", href: "/admin/economia", label: "navWallet" },
      { section: "cosmetics", href: "/admin/cosmeticos", label: "navCosmetics" },
    ],
  },
  {
    title: "navSystem",
    items: [
      { section: "analytics", href: "/admin/analytics", label: "navAnalytics" },
      { section: "staffLog", href: "/admin/staff-log", label: "navAudit" },
    ],
  },
];
