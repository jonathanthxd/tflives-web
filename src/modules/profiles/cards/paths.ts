export const PROFILE_CARD_SIZE = { width: 1200, height: 630 };
export function profileCardImagePath(locale: string, username: string) {
  return `/${locale === "en" ? "en" : "es"}/perfil/${username}/opengraph-image`;
}
