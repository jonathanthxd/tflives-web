import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";

const privateRoutes = [
  "/api/",
  "/*/admin/",
  "/*/mensajes",
  "/*/amigos",
  "/*/configuracion",
  "/*/suscripcion",
  "/*/onboarding/",
  "/*/login",
  "/*/register",
  "/*/forgot-password",
  "/*/reset-password",
  "/*/verify-email",
  "/*/two-factor",
  "/*/streamers/apply",
  "/*/cosmeticos",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privateRoutes,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
