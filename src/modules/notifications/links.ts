interface NotificationLike {
  type: string;
  conversationId?: string | null;
  recipientUsername?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actor?: { username: string | null } | null;
}

/**
 * A dónde navegar al hacer click en una notificación, según su categoría.
 * Los anuncios se leen completos en el dropdown y no necesitan otra ruta.
 */
export function getNotificationHref(n: NotificationLike): string | null {
  if (n.entityType === "GlobalChatMessage") return "/comunidad#chat-global";
  if (n.entityType === "Conversation") return n.entityId ? `/mensajes?c=${n.entityId}` : "/mensajes";
  if (n.entityType === "DirectMessage") return n.conversationId ? `/mensajes?c=${encodeURIComponent(n.conversationId)}` : "/mensajes";
  if (n.entityType === "User") return n.actor?.username ? `/perfil/${encodeURIComponent(n.actor.username)}` : "/configuracion#profile";
  switch (n.type) {
    case "ACHIEVEMENT":
    case "LEVEL_UP":
      return n.recipientUsername ? `/perfil/${encodeURIComponent(n.recipientUsername)}#achievements` : "/configuracion#profile";
    case "SECURITY_ALERT":
      return "/configuracion#security";
    case "FRIEND_REQUEST":
      return "/amigos";
    case "FRIEND_ACCEPTED":
      return n.actor?.username ? `/perfil/${n.actor.username}` : "/amigos";
    case "POST_PUBLISHED":
    case "REPLY":
    case "MENTION":
    case "REACTION":
      return n.entityId ? `/network/${n.entityId}` : "/network";
    case "MESSAGE":
      return "/mensajes";
    case "TFL_COINS":
      return "/configuracion#wallet";
    case "COSMETIC":
      return "/cosmeticos";
    case "PREMIUM":
      return "/cosmeticos";
    case "CREATOR_APPLICATION":
      return "/streamers/apply";
    case "CREATOR_APPROVED":
    case "CREATOR_STATUS":
    case "CREATOR_FEATURED":
      return n.entityId ? "/streamers/apply" : "/streamers";
    case "CREATOR_REJECTED":
      return "/streamers/apply";
    default:
      return null;
  }
}
