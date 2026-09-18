import { NextResponse } from "next/server";
import { captureApplicationError, sanitizeApplicationErrorMessage } from "@/modules/analytics/service";
import { enforceRateLimit } from "@/infrastructure/rate-limit/service";

/** Vercel exposes the real client address here; never stored raw. */
function clientIpAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

/**
 * Minimal, public entrypoint for client-side JavaScript errors. Deliberately
 * small: it trusts nothing, sanitizes everything, and stores no URLs, stacks,
 * account identifiers, or raw IPs. The optional `area` is code-owned and kept
 * to the same shape the server pipeline uses.
 */
export async function POST(request: Request) {
  const limited = await enforceRateLimit("client-errors", clientIpAddress(request));
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const message =
    typeof (body as { message?: unknown }).message === "string"
      ? (body as { message: string }).message.slice(0, 5000)
      : "";
  if (!message.trim()) {
    return NextResponse.json({ error: "Falta el mensaje de error" }, { status: 400 });
  }

  const area = typeof (body as { area?: unknown }).area === "string"
    ? (body as { area: string }).area.slice(0, 80)
    : "client";

  const safeMessage = sanitizeApplicationErrorMessage(message);
  await captureApplicationError({
    area: area || "client",
    error: new Error(safeMessage),
    status: 0,
    source: "client",
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}