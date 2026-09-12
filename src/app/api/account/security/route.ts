import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth, trustedAuthOrigins } from "@/infrastructure/auth/auth";
import { getCurrentSession } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { recordSecurityEvent, summarizeUserAgent } from "@/modules/security/service";

const mutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("revoke-session"), sessionId: z.string().min(1) }),
  z.object({ action: z.literal("revoke-others") }),
]);

function sameTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return origin !== null && trustedAuthOrigins.includes(origin);
}

function jsonUnauthorized() {
  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}

export async function GET() {
  const current = await getCurrentSession();
  if (!current) return jsonUnauthorized();

  try {
    // Better Auth remains the authority for active-session filtering. Tokens
    // are deliberately never sent to the browser by this account view.
    const activeSessions = await auth.api.listSessions({ headers: await headers() });
    const [accounts, user, events] = await Promise.all([
      prisma.account.findMany({
        where: { userId: current.user.id },
        select: { id: true, providerId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.user.findUnique({
        where: { id: current.user.id },
        select: { email: true, emailVerified: true, twoFactorEnabled: true },
      }),
      prisma.securityEvent.findMany({
        where: { userId: current.user.id },
        select: { id: true, event: true, userAgent: true, metadata: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    return NextResponse.json({
      email: user?.email ?? current.user.email,
      emailVerified: user?.emailVerified ?? current.user.emailVerified,
      twoFactorEnabled: user?.twoFactorEnabled ?? false,
      hasPassword: accounts.some((account) => account.providerId === "credential"),
      accounts,
      sessions: activeSessions.map((session) => ({
        id: session.id,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        current: session.token === current.session.token,
        device: summarizeUserAgent(session.userAgent),
      })),
      events,
    });
  } catch {
    // listSessions intentionally requires Better Auth's fresh-session check.
    return NextResponse.json({ error: "SESSION_NOT_FRESH" }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  if (!sameTrustedOrigin(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  const current = await getCurrentSession();
  if (!current) return jsonUnauthorized();

  const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

  try {
    const requestHeaders = await headers();
    if (parsed.data.action === "revoke-session") {
      const target = await prisma.session.findFirst({
        where: { id: parsed.data.sessionId, userId: current.user.id },
        select: { id: true, token: true },
      });
      if (!target) return NextResponse.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });

      await auth.api.revokeSession({ headers: requestHeaders, body: { token: target.token } });
      await recordSecurityEvent({ userId: current.user.id, event: "SESSION_REVOKED" });
      return NextResponse.json({ currentSession: target.token === current.session.token });
    }

    await auth.api.revokeOtherSessions({ headers: requestHeaders });
    await recordSecurityEvent({ userId: current.user.id, event: "OTHER_SESSIONS_REVOKED" });
    return NextResponse.json({ status: true });
  } catch {
    return NextResponse.json({ error: "SECURITY_ACTION_FAILED" }, { status: 400 });
  }
}
