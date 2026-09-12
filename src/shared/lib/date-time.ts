function normalizedLocale(locale?: string) {
  return locale?.toLowerCase().startsWith("es") ? "es-CO" : "en-US";
}

export function formatUserTime(value: Date | string | number, locale?: string, timeZone?: string) {
  return new Intl.DateTimeFormat(normalizedLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(value));
}

export function formatUserDateTime(value: Date | string | number, locale?: string, timeZone?: string) {
  return new Intl.DateTimeFormat(normalizedLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(value));
}
