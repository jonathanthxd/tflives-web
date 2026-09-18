export type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type StaticSeoRoute = {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
};

export const staticSeoRoutes: StaticSeoRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/proyectos", changeFrequency: "monthly", priority: 0.8 },
  { path: "/comunidad", changeFrequency: "weekly", priority: 0.8 },
  { path: "/equipo", changeFrequency: "monthly", priority: 0.6 },
  { path: "/trayectoria", changeFrequency: "monthly", priority: 0.7 },
  { path: "/network", changeFrequency: "weekly", priority: 0.9 },
  { path: "/network/estado", changeFrequency: "daily", priority: 0.6 },
  { path: "/network/tienda", changeFrequency: "monthly", priority: 0.5 },
  { path: "/network/wiki", changeFrequency: "weekly", priority: 0.8 },
  { path: "/streamers", changeFrequency: "weekly", priority: 0.8 },
  { path: "/privacidad", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terminos", changeFrequency: "yearly", priority: 0.3 },
];
