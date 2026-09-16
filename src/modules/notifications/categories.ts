/**
 * Notification categories shared by browser settings and server-side APIs.
 * Keep this module free of database imports so it can safely be bundled for
 * client components.
 */
export const NOTIFICATION_CATEGORIES = [
  "FRIEND_REQUEST",
  "FRIEND_ACCEPTED",
  "REPLY",
  "REACTION",
  "MENTION",
  "MESSAGE",
  "ACHIEVEMENT",
  "POST_PUBLISHED",
  "ANNOUNCEMENT",
  "SECURITY_ALERT",
  "LEVEL_UP",
  "TFL_COINS",
  "COSMETIC",
  "PREMIUM",
  "CREATOR_APPLICATION",
  "CREATOR_APPROVED",
  "CREATOR_REJECTED",
  "CREATOR_STATUS",
  "CREATOR_FEATURED",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
