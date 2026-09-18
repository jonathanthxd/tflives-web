import { errorFromEvent, sendClientError } from "@/shared/observability/client-error";

// Runs before hydration to install global browser error capture. Wrapped so a
// monitoring failure can never break the app bootstrap.
try {
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      sendClientError(errorFromEvent(event), "client:window");
    });
    window.addEventListener("unhandledrejection", (event) => {
      sendClientError(errorFromEvent(event), "client:unhandledrejection");
    });
  }
} catch {
  /* Best-effort client telemetry. */
}