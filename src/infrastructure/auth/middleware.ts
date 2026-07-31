import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const PROTECTED_PREFIXES = ["/admin"];

function splitLocale(pathname: string): { locale: string; rest: string } {
  const match = pathname.match(/^\/([a-z]{2})(\/.*|$)/);
  if (match && (routing.locales as readonly string[]).includes(match[1])) {
    return { locale: match[1], rest: match[2] || "/" };
  }
  return { locale: routing.defaultLocale, rest: pathname };
}

export async function updateSession(request: NextRequest, baseResponse?: NextResponse) {
  let response = baseResponse ?? NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { locale, rest } = splitLocale(request.nextUrl.pathname);
  const isProtected = PROTECTED_PREFIXES.some((prefix) => rest.startsWith(prefix));

  // El middleware solo garantiza autenticación (puede correr en Edge runtime,
  // donde Prisma no está disponible de forma confiable). El rol ADMIN se valida
  // a nivel de layout/route: src/app/[locale]/(administration)/layout.tsx y
  // src/app/api/posts/route.ts.
  if (isProtected && !user) {
    const redirectUrl = new URL(`/${locale}/login`, request.url);
    redirectUrl.searchParams.set("redirect", rest);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
