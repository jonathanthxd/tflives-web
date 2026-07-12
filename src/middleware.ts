import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple JWT verify for middleware (Edge-compatible)
function verifyTokenSimple(token: string): { userId: string; email: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.userId || !payload.role) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin")) {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);

    const token = cookies["tfl_token"];

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = verifyTokenSimple(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};