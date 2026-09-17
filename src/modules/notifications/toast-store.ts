export interface NotificationToast {
  id: string;
  type: string;
  actorName: string | null;
  entityType: string | null;
  entityId: string | null;
  conversationId?: string | null;
  recipientUsername?: string | null;
  announcementTitle?: string | null;
}

type Listener = (toast: NotificationToast) => void;

const listeners = new Set<Listener>();

export function publishNotificationToast(toast: NotificationToast) {
  listeners.forEach((listener) => listener(toast));
}

export function subscribeToNotificationToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
