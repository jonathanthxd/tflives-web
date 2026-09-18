// Fire-and-forget reporter for browser errors. Never throws, never blocks the
// main thread, and attempts a beacon first so the request survives navigation.
const ENDPOINT = "/api/observability/client-error";

export function sendClientError(message: string, area = "client") {
  try {
    if (typeof window === "undefined") return;
    const payload = new Blob(
      [JSON.stringify({ message: message.slice(0, 5000), area: area.slice(0, 80) })],
      { type: "application/json" },
    );
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, payload);
      return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.slice(0, 5000), area: area.slice(0, 80) }),
    }).catch(() => {});
  } catch {
    /* Reporting must never interrupt the app. */
  }
}

export function errorFromEvent(event: ErrorEvent | PromiseRejectionEvent): string {
  if ("error" in event && event.error) {
    const error = event.error as unknown;
    return error instanceof Error ? String(error.message) : String(error);
  }
  const reason = (event as PromiseRejectionEvent).reason;
  return reason instanceof Error ? String(reason.message) : String(reason);
}