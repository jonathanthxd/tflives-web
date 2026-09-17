import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";

export async function GET(request: Request) {
  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit") ?? 30);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 100) : 30;

  const [notifications, unreadCount, recipient] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { userId: authUser.id, read: false } }),
    prisma.user.findUnique({ where: { id: authUser.id }, select: { username: true } }),
  ]);

  const actorIds = [...new Set(notifications.map((n) => n.actorId).filter((id): id is string => !!id))];
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, displayName: true, name: true, username: true, image: true },
      })
    : [];
  const actorsById = new Map(actors.map((a) => [a.id, a]));

  const announcementIds = [
    ...new Set(
      notifications
        .filter((n) => n.entityType === "Announcement" && n.entityId)
        .map((n) => n.entityId as string)
    ),
  ];
  const announcements = announcementIds.length
    ? await prisma.announcement.findMany({
        where: { id: { in: announcementIds } },
        select: { id: true, title: true, body: true },
      })
    : [];
  const announcementsById = new Map(announcements.map((a) => [a.id, a]));

  const directIds = notifications.filter((n) => n.entityType === "DirectMessage" && n.entityId).map((n) => n.entityId!);
  const directMessages = directIds.length ? await prisma.directMessage.findMany({ where: { id: { in: directIds }, conversation: { participants: { some: { userId: authUser.id, status: { not: "LEFT" } } } } }, select: { id: true, conversationId: true } }) : [];
  const conversationByMessage = new Map(directMessages.map((m) => [m.id, m.conversationId]));
  const enriched = notifications.map((n) => ({
    ...n,
    recipientUsername: recipient?.username ?? null,
    conversationId: n.entityType === "DirectMessage" && n.entityId ? conversationByMessage.get(n.entityId) ?? null : null,
    actor: n.actorId ? actorsById.get(n.actorId) ?? null : null,
    announcement:
      n.entityType === "Announcement" && n.entityId ? announcementsById.get(n.entityId) ?? null : null,
  }));

  return NextResponse.json({ notifications: enriched, unreadCount });
}

export async function PATCH(request: Request) {
  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = z.union([z.object({ id: z.string().min(1).max(200) }).strict(), z.object({ markAllRead: z.literal(true) }).strict()]).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const id = "id" in parsed.data ? parsed.data.id : undefined;
  const markAllRead = "markAllRead" in parsed.data;

  if (markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: authUser.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (id) {
    await prisma.notification.updateMany({
      where: { id, userId: authUser.id },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
}
