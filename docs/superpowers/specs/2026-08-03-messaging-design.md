# Mensajería privada — Spec

**Fecha**: 2026-08-03
**Estado**: Aprobado, listo para implementación.

## Alcance

Reemplaza el placeholder de `/mensajes` por mensajería privada real: conversaciones
uno a uno y grupales, con apertura voluntaria de chats de no-amigos, bloqueo,
reporte (solo guardado, sin panel admin todavía) y notificaciones de mensajes
nuevos. Sin presencia (conectado/ausente) ni llamadas, según el PDF.

## Decisiones confirmadas

1. **Quién puede escribirle a quién**: amigos → conversación se abre directo.
   No-amigos → el mensaje llega igual, pero el lado del destinatario queda
   como "solicitud" hasta que la abra voluntariamente (esto es la "apertura
   voluntaria de chats" del PDF).
2. **Grupos**: cualquiera crea un grupo, pero solo puede agregar a sus propios
   amigos. El creador es OWNER (puede sacar miembros); cualquier miembro
   puede irse solo. Sin solicitud de apertura en grupos (ya son amigos).
3. **Bloqueo**: total — no puede escribirte, no ve tu perfil, tu bandeja oculta
   la conversación existente (no se borran los mensajes).
4. **Reportes**: se guardan en base (motivo, quién, qué) sin UI de admin
   todavía — se construye cuando exista el panel de admin de reportes.

## Modelo de datos (Prisma)

```prisma
model Conversation {
  id           String                     @id @default(cuid())
  isGroup      Boolean                    @default(false)
  name         String?
  createdById  String
  createdAt    DateTime                   @default(now())
  updatedAt    DateTime                   @updatedAt
  participants ConversationParticipant[]
  messages     DirectMessage[]
}

model ConversationParticipant {
  id             String            @id @default(cuid())
  conversationId String
  conversation   Conversation      @relation(fields: [conversationId], references: [id])
  userId         String
  user           User              @relation(fields: [userId], references: [id])
  role           ParticipantRole   @default(MEMBER)
  status         ParticipantStatus @default(ACTIVE)
  lastReadAt     DateTime?
  joinedAt       DateTime          @default(now())

  @@unique([conversationId, userId])
}

model DirectMessage {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id])
  content        String       @db.Text
  createdAt      DateTime     @default(now())
}

model Block {
  id        String   @id @default(cuid())
  blockerId String
  blocker   User     @relation("Blocker", fields: [blockerId], references: [id])
  blockedId String
  blocked   User     @relation("Blocked", fields: [blockedId], references: [id])
  createdAt DateTime @default(now())

  @@unique([blockerId, blockedId])
}

model Report {
  id         String   @id @default(cuid())
  reporterId String
  reporter   User     @relation("Reporter", fields: [reporterId], references: [id])
  targetType String   // "MESSAGE" | "CONVERSATION" | "USER"
  targetId   String
  reason     String   @db.Text
  createdAt  DateTime @default(now())
}

enum ParticipantRole { OWNER MEMBER }
enum ParticipantStatus { ACTIVE PENDING LEFT }
```

## Lógica

- **Iniciar DM 1:1**: si ya existe conversación no-grupal entre ambos, reusarla.
  Si no, crearla; el participante emisor entra ACTIVE, el receptor entra ACTIVE
  si son amigos, o PENDING si no. Bloqueado por el receptor → 403.
- **Solicitudes de mensaje**: conversaciones donde el participante propio está
  PENDING se listan aparte en la bandeja. "Abrir" pasa el status a ACTIVE.
  "Rechazar" pasa el status a LEFT (no vuelve a aparecer, no borra mensajes).
- **Grupos**: creador OWNER + ACTIVE, miembros agregados (deben ser amigos del
  creador) entran ACTIVE directo. Sacar miembro (solo OWNER) o irse (cualquiera)
  → status LEFT.
- **Mandar mensaje**: solo participantes con status ACTIVE. Actualiza
  `Conversation.updatedAt` para ordenar la bandeja por actividad reciente.
  Dispara notificación `MESSAGE` a los demás participantes ACTIVE (respeta
  preferencias, ya existente).
- **Bloquear**: crea `Block`. Oculta conversaciones 1:1 existentes con esa
  persona de la bandeja del bloqueador (filtro en la query, no delete).
  Impide nuevas conversaciones en cualquier dirección.
- **Reportar**: guarda `Report` con el tipo y motivo. Sin efecto automático.

## Tiempo real

- Igual que notificaciones: polling autenticado sobre la API que consulta
  `DirectMessage`, filtrado por `conversationId`) mientras la conversación
  está abierta en pantalla. RLS: solo pueden leer mensajes los participantes
  con status ACTIVE o PENDING de esa conversación.
- Notificación `MESSAGE` ya existente en el sistema de notificaciones se
  encarga del aviso fuera de la conversación abierta (badge, toast, browser).

## UI

- `/mensajes` pasa de placeholder a bandeja real: lista de conversaciones
  (1:1 y grupales) ordenadas por actividad, sección separada de "Solicitudes
  de mensaje", botones "Nuevo mensaje" (buscar entre amigos) y "Nuevo grupo"
  (elegir varios amigos + nombre opcional).
- Vista de conversación: mensajes en vivo, composer, menú con
  Bloquear/Reportar/Salir (grupos)/Ver perfil.
- Sin indicadores de presencia. Sin botones de llamada.

## Fuera de alcance

- Estados de presencia (conectado/ausente/ocupado).
- Llamadas de voz o video.
- Panel de admin para revisar reportes (se guardan, se ven después).
- Edición/borrado de mensajes, reacciones, adjuntos — no pedidos, no se agregan.
