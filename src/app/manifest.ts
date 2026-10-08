import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: `/${siteConfig.defaultLocale}`,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f1115",
    theme_color: "#0f1115",
    lang: siteConfig.defaultLocale,
    dir: "ltr",
    categories: ["games", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
