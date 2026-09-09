import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getSessionCookie } from "better-auth/cookies";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);
const PROTECTED_PREFIXES = ["/admin"];

function splitLocale(pathname: string): { locale: string; rest: string } {
  const match = pathname.match(/^\/([a-z]{2})(\/.*|$)/);
  if (match && (routing.locales as readonly string[]).includes(match[1])) {
    return { locale: match[1], rest: match[2] || "/" };
  }
  return { locale: routing.defaultLocale, rest: pathname };
}

/**
 * Middleware ligero: next-intl resuelve el locale y Better Auth solo se usa
 * aquí para una redirección optimista basada en la presencia de la cookie.
 * La sesión y los permisos reales SIEMPRE se validan de nuevo server-side en
 * los layouts/route handlers con Better Auth + Prisma.
 */
export function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  // Si next-intl agrega/corrige el prefijo de idioma, no pisamos su redirect.
  if (intlResponse.headers.get("location")) return intlResponse;

  const { locale, rest } = splitLocale(request.nextUrl.pathname);
  const isProtected = PROTECTED_PREFIXES.some((prefix) => rest.startsWith(prefix));

  if (isProtected && !getSessionCookie(request)) {
    const redirectUrl = new URL(`/${locale}/login`, request.url);
    redirectUrl.searchParams.set("redirect", rest);
    return NextResponse.redirect(redirectUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
