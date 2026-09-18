import { renderDefaultOgImage } from "@/shared/seo/og-image";

export const alt = "TFLives — Time For Lives";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderDefaultOgImage();
}
