import { AnnouncementSegment, Role } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export class AnnouncementError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function whereForSegment(segment: AnnouncementSegment, excludeUserId: string) {
  const base = { id: { not: excludeUserId } };
  if (segment === "USERS") return { ...base, role: "USER" as const };
  if (segment === "STAFF") return { ...base, role: { in: ["MOD", "ADMIN"] as Role[] } };
  return base;
}

export async function createAnnouncement(
  createdById: string,
  title: string,
  body: string,
  segment: AnnouncementSegment
) {
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  if (!trimmedTitle) throw new AnnouncementError("El título es obligatorio");
  if (!trimmedBody) throw new AnnouncementError("El mensaje es obligatorio");
  if (trimmedTitle.length > 200) throw new AnnouncementError("El título es demasiado largo");
  if (trimmedBody.length > 2000) throw new AnnouncementError("El mensaje es demasiado largo");

  return prisma.$transaction(async (tx) => {
    const announcement = await tx.announcement.create({ data: { title: trimmedTitle, body: trimmedBody, segment, createdById } });
    const recipients = await tx.user.findMany({
      where: { ...whereForSegment(segment, createdById), notificationPreferences: { none: { category: "ANNOUNCEMENT", inAppEnabled: false } } },
      select: { id: true },
    });
    if (recipients.length) await tx.notification.createMany({ data: recipients.map((user) => ({ userId: user.id, type: "ANNOUNCEMENT" as const, actorId: createdById, entityType: "Announcement", entityId: announcement.id })) });
    await tx.adminActionLog.create({ data: { actorId: createdById, action: "announcement.send", targetType: "Announcement", targetId: announcement.id, metadata: { title: trimmedTitle, segment, recipients: recipients.length } } });
    return { announcement, recipientCount: recipients.length };
  });
}

export async function listAnnouncements() {
  return prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, username: true, displayName: true, name: true } },
    },
    take: 100,
  });
}
