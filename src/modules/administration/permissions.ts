import { Role } from "@prisma/client";

/**
 * Secciones reales del panel admin (con sistema de datos detrás). Las
 * secciones sin sistema fuente (wiki, equipo, economía, cosméticos,
 * suscripciones, streamers, logros) no tienen permisos propios: son solo
 * un placeholder visual en la sidebar, no rutas reales.
 */
export const ADMIN_SECTIONS = [
  "dashboard",
  "posts",
  "modalities",
  "users",
  "reports",
  "moderation",
  "staffLog",
  "analytics",
  "announcements",
  "team",
  "achievements",
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
  modalities: ["ADMIN"],
  users: ["ADMIN"],
  reports: ["MOD", "ADMIN"],
  moderation: ["MOD", "ADMIN"],
  staffLog: ["ADMIN"],
  analytics: ["ADMIN"],
  announcements: ["ADMIN"],
  team: ["ADMIN"],
  achievements: ["ADMIN"],
};

export function canAccessSection(role: Role, section: AdminSection): boolean {
  return SECTION_ACCESS[section].includes(role);
}

/** Puede entrar al panel admin en general (aunque no a todas las secciones). */
export function canAccessAdminPanel(role: Role): boolean {
  return role === "MOD" || role === "ADMIN";
}

/**
 * Acciones de moderación puntuales (además del gate de sección). Cambiar el
 * rol de otro usuario y desbanear son siempre ADMIN-only, sin importar la
 * sección desde la que se dispare la acción.
 */
export function canChangeRoles(role: Role): boolean {
  return role === "ADMIN";
}

export function canManageSanctions(role: Role): boolean {
  return role === "MOD" || role === "ADMIN";
}

export interface AdminNavItem {
  section: AdminSection;
  href: string;
  label: string;
  description?: string;
}

export interface AdminPlaceholderItem {
  label: string;
  /** Clave para PLACEHOLDER_ICONS en components/ui/icons.tsx */
  iconKey: string;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
  placeholders?: AdminPlaceholderItem[];
}

/** Estructura de la sidebar admin: agrupa las 8 secciones reales y los 8
 * placeholders "Próximamente" siguiendo el orden de la spec §20. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: "General",
    items: [
      { section: "dashboard", href: "/admin", label: "Dashboard" },
      { section: "analytics", href: "/admin/analytics", label: "Analítica" },
      { section: "staffLog", href: "/admin/staff-log", label: "Registro de staff" },
    ],
  },
  {
    title: "Contenido",
    items: [
      {
        section: "posts",
        href: "/admin/posts",
        label: "Noticias y TFL Network",
        description: "Noticias, actualizaciones, parches y eventos",
      },
      { section: "modalities", href: "/admin/modalities", label: "Modalidades" },
      { section: "team", href: "/admin/team", label: "Equipo público" },
    ],
    placeholders: [{ label: "Artículos de wiki", iconKey: "wiki" }],
  },
  {
    title: "Comunidad",
    items: [
      { section: "users", href: "/admin/users", label: "Usuarios y roles" },
      {
        section: "moderation",
        href: "/admin/moderation",
        label: "Sanciones",
        description: "Banear, suspender, silenciar, advertir",
      },
      {
        section: "reports",
        href: "/admin/reports",
        label: "Reportes",
        description: "Apelaciones y moderación de mensajes",
      },
      {
        section: "achievements",
        href: "/admin/achievements",
        label: "Logros e insignias",
        description: "Catálogo de logros y otorgamiento a usuarios",
      },
    ],
  },
  {
    title: "Economía",
    items: [],
    placeholders: [
      { label: "TFL Coins", iconKey: "coins" },
      { label: "Cosméticos", iconKey: "cosmetics" },
      { label: "Suscripciones", iconKey: "subscriptions" },
    ],
  },
  {
    title: "Otros",
    items: [
      {
        section: "announcements",
        href: "/admin/announcements",
        label: "Anuncios globales",
        description: "Notificaciones segmentadas a toda la comunidad",
      },
    ],
    placeholders: [{ label: "Streamers y clientes", iconKey: "streamers" }],
  },
];
