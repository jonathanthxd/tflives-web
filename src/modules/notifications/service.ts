import { NotificationType } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export const NOTIFICATION_CATEGORIES: NotificationType[] = [
  "FRIEND_REQUEST",
  "FRIEND_ACCEPTED",
  "REPLY",
  "REACTION",
  "MENTION",
  "MESSAGE",
  "ACHIEVEMENT",
  "POST_PUBLISHED",
  "ANNOUNCEMENT",
];

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  actorId?: string;
  entityType?: string;
  entityId?: string;
}

/**
 * Inserta una notificación respetando la preferencia in-app del destinatario
 * para esa categoría (si el usuario nunca configuró preferencias, el default
 * es notificar). No dispara nada del lado del navegador — eso lo hace el
 * cliente al recibir el INSERT vía Supabase Realtime.
 */
export async function createNotification({
  userId,
  type,
  actorId,
  entityType,
  entityId,
}: CreateNotificationInput) {
  const preference = await prisma.notificationPreference.findUnique({
    where: { userId_category: { userId, category: type } },
  });

  if (preference && !preference.inAppEnabled) return null;

  return prisma.notification.create({
    data: { userId, type, actorId, entityType, entityId },
  });
}

/**
 * Notifica a todos los usuarios registrados de un post nuevo. No hay concepto
 * de "seguir contenido" todavía, así que por ahora es un anuncio global — ver
 * spec docs/superpowers/specs/2026-08-03-social-notifications-design.md.
 */
export async function notifyPostPublished(postSlug: string, authorId: string) {
  const users = await prisma.user.findMany({
    where: { id: { not: authorId } },
    select: { id: true },
  });

  await Promise.all(
    users.map((u) =>
      createNotification({
        userId: u.id,
        type: "POST_PUBLISHED",
        actorId: authorId,
        entityType: "Post",
        entityId: postSlug,
      })
    )
  );
}
