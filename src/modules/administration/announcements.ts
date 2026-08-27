import { AnnouncementSegment, Role } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { createNotification } from "@/modules/notifications/service";
import { logAdminAction } from "@/modules/administration/action-log";

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

  const announcement = await prisma.announcement.create({
    data: { title: trimmedTitle, body: trimmedBody, segment, createdById },
  });

  const recipients = await prisma.user.findMany({
    where: whereForSegment(segment, createdById),
    select: { id: true },
  });

  await Promise.all(
    recipients.map((r) =>
      createNotification({
        userId: r.id,
        type: "ANNOUNCEMENT",
        actorId: createdById,
        entityType: "Announcement",
        entityId: announcement.id,
      })
    )
  );

  await logAdminAction({
    actorId: createdById,
    action: "announcement.send",
    targetType: "Announcement",
    targetId: announcement.id,
    metadata: { title: trimmedTitle, segment, recipients: recipients.length },
  });

  return { announcement, recipientCount: recipients.length };
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
