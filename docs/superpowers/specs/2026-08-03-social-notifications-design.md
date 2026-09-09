# Social (amigos/seguidores) + Notificaciones en tiempo real — Spec

**Fecha**: 2026-08-03
**Estado**: Aprobado, listo para plan de implementación.

## Alcance

Reemplaza los placeholders visuales que ya existen (ícono de amigos en la navbar,
item "Amigos" en el menú de usuario, card "Comunidad" en el perfil) por
funcionalidad real de amistades y seguidores, más un sistema de notificaciones
en tiempo real con centro de notificaciones y preferencias.

Fuera de alcance para esta iteración (quedan como categorías "mudas" en el
sistema de notificaciones, sin disparador real todavía): comentarios/respuestas,
reacciones, menciones, mensajería directa, logros. Se agregan disparadores reales
cuando se construyan esos módulos.

## Decisiones de arquitectura (confirmadas con Jonathan)

1. **Actualización cercana a tiempo real**: polling de las APIs de Next.js sobre la tabla
   `Notification`, filtrado por `userId`). Nada de polling.
2. **Notificaciones de navegador**: `Notification` API estándar del browser,
   solo mientras haya una pestaña de TFLives abierta y el usuario haya dado
   permiso. No se implementa Web Push real (service worker + VAPID) — eso
   requeriría notificar con la pestaña/navegador cerrado, que quedó
   explícitamente fuera de alcance.
3. **Categorías de notificación**: se listan las 7 categorías del PDF desde
   ya (solicitudes, aceptaciones, respuestas, reacciones, menciones, mensajes,
   logros, novedades oficiales) tanto en el centro de notificaciones como en
   preferencias, pero solo **solicitud de amistad**, **amistad aceptada** y
   **post nuevo publicado** disparan notificaciones reales hoy.

## Modelo de datos (Prisma)

```prisma
model Friendship {
  id           String           @id @default(cuid())
  requesterId  String
  requester    User             @relation("FriendshipRequester", fields: [requesterId], references: [id])
  addresseeId  String
  addressee    User             @relation("FriendshipAddressee", fields: [addresseeId], references: [id])
  status       FriendshipStatus @default(PENDING)
  createdAt    DateTime         @default(now())
  respondedAt  DateTime?

  @@unique([requesterId, addresseeId])
}

enum FriendshipStatus {
  PENDING
  ACCEPTED
  DECLINED
}

model Follow {
  id          String   @id @default(cuid())
  followerId  String
  follower    User     @relation("Follower", fields: [followerId], references: [id])
  followingId String
  following   User     @relation("Following", fields: [followingId], references: [id])
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
}

model Notification {
  id         String            @id @default(cuid())
  userId     String
  user       User              @relation(fields: [userId], references: [id])
  type       NotificationType
  actorId    String?
  entityType String?
  entityId   String?
  read       Boolean           @default(false)
  createdAt  DateTime          @default(now())
}

enum NotificationType {
  FRIEND_REQUEST
  FRIEND_ACCEPTED
  REPLY
  REACTION
  MENTION
  MESSAGE
  ACHIEVEMENT
  POST_PUBLISHED
}

model NotificationPreference {
  id             String           @id @default(cuid())
  userId         String
  user           User             @relation(fields: [userId], references: [id])
  category       NotificationType
  inAppEnabled   Boolean          @default(true)
  browserEnabled Boolean          @default(true)

  @@unique([userId, category])
}
```

En `User` se agregan dos campos:
- `allowFriendRequests Boolean @default(true)`
- `friendsListVisibility FriendsListVisibility @default(PUBLIC)` con
  `enum FriendsListVisibility { PUBLIC FRIENDS_ONLY PRIVATE }`

## Amigos y seguidores

- **Enviar solicitud**: crea `Friendship` PENDING. Rechazado si:
  - el destinatario tiene `allowFriendRequests = false`
  - ya existe una `Friendship` PENDING o ACCEPTED entre ambos (en cualquier dirección)
- **Aceptar / rechazar**: solo el `addressee` puede responder una PENDING.
- **Eliminar amistad**: cualquiera de los dos, sobre una ACCEPTED.
- **Seguir / dejar de seguir**: independiente, sin aprobación, un solo lado crea/borra su `Follow`.
- **Lista de amigos**: unión de `Friendship` ACCEPTED donde el usuario es requester o addressee. Visibilidad respeta `friendsListVisibility` del dueño del perfil (si es `FRIENDS_ONLY`, solo la ven sus amigos; si es `PRIVATE`, solo el dueño).
- **Card "Comunidad" del perfil** (hoy `FriendsPlaceholder`): pasa a mostrar conteo real de amigos/seguidores. Si `isOwner` es `false`, se agregan botones "Agregar amigo" / "Solicitud enviada" / "Aceptar solicitud" / "Ya son amigos" según el estado, y "Seguir"/"Dejar de seguir" independiente.

## Privacidad

Se agrega una sección nueva en la página de edición de perfil (o un panel de
configuración simple, a decidir en el plan de implementación) con:
- Toggle "Permitir solicitudes de amistad"
- Selector "Quién puede ver mi lista de amigos" (Todos / Solo amigos / Nadie)

## Notificaciones

- Helper server-side `createNotification({ userId, type, actorId?, entityType?, entityId? })` en `modules/notifications` que inserta la fila y respeta `NotificationPreference.inAppEnabled` (si está en `false` para esa categoría, no se crea la notificación in-app).
- Disparadores reales de esta iteración:
  - Crear `Friendship` PENDING → notifica al `addressee` (`FRIEND_REQUEST`)
  - Aceptar `Friendship` → notifica al `requester` (`FRIEND_ACCEPTED`)
  - Publicar un `Post` (`published: true`) → notifica a todos los usuarios que siguen a... (no hay concepto de "seguir contenido" todavía) — se simplifica a: notifica a **todos los usuarios registrados** como anuncio oficial. Si el volumen de usuarios crece mucho, se revisita (fuera de alcance ahora).
- **Centro de notificaciones**: dropdown en el ícono de campana del navbar (hoy inerte). Lista ordenada por fecha, separador visual leído/no-leído, click en un item lo marca como leído, botón "Marcar todo como leído".
- **Badge de no-leídas**: contador en el ícono de campana, actualizado mediante polling autenticado de la API de notificaciones. La capa podrá migrarse a WebSocket/SSE sin cambiar el modelo de dominio.
- **Preferencias**: página nueva `/perfil/[username]/notificaciones` (o similar, a definir en el plan) con un toggle in-app/navegador por cada una de las 7 categorías.
- **Notificación de navegador**: al recibir un evento de Realtime, si `Notification.permission === "granted"` y la preferencia `browserEnabled` de esa categoría está activa, se dispara `new Notification(...)`. Se pide permiso la primera vez que el usuario abre el centro de notificaciones (no automáticamente al cargar la página).

## Módulos afectados

- `modules/social/` — deja de tener solo el placeholder; se llena con lógica y componentes reales de amistad/seguidores.
- `modules/notifications/` — ídem, deja de estar vacío.
- `shared/ui/layout/navbar.tsx` — el ícono de campana y de amigos dejan de ser botones inertes.
- `modules/profiles/components/profile-view.tsx` — se agregan los botones de acción social cuando `isOwner` es `false`, y la card de Comunidad pasa a usar datos reales.

## Fuera de alcance (explícito)

- Web Push real (service worker, VAPID, notificar con navegador cerrado).
- Disparadores reales de reacciones, menciones, respuestas, mensajería, logros (las categorías existen pero no se disparan todavía).
- Traducción de la nueva UI a inglés en esta misma iteración — se hace en una pasada de i18n aparte una vez que el feature esté estable, siguiendo el mismo patrón ya usado (`next-intl`, namespaces en `messages/es.json` y `en.json`).
