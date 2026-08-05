# Panel administrativo + roles y permisos finos — Spec

**Fecha**: 2026-08-03
**Estado**: Aprobado (por instrucción directa), ejecutando.

## Alcance

Construir el panel de administración completo (spec §20) con las 20 secciones
listadas. Las que tienen un sistema real detrás (o son razonables de construir
ahora) quedan funcionales; el resto queda como placeholder claramente marcado
"Próximamente" — a diferencia de los placeholders públicos (donde se pidió
sacar el "Próximamente" para que se vean habilitados), acá SÍ se deja
explícito porque es una herramienta interna: un botón de "banear" o "gestionar
TFL Coins" que aparente funcionar sin hacerlo es directamente peligroso.

De una: se programa el sistema de roles y permisos finos (no solo
USER/MOD/ADMIN como gate binario).

## Qué queda REAL

| Sección del PDF | Implementación |
|---|---|
| Dashboard con métricas clave | Números reales: usuarios, posts, amigos, mensajes, reportes pendientes |
| Crear/editar/publicar/archivar noticias | CRUD de `Post` ya existente + edición + archivado (`archived: Boolean`) |
| Actualizaciones, changelogs, eventos | Son `Post` con `type` UPDATE/PATCH/EVENT — mismo CRUD, filtro por tipo |
| Administrar TFL Network | Igual que arriba — es la misma sección de posts |
| Editar páginas de modalidades | CRUD nuevo de `Modality` |
| Administrar usuarios, perfiles, roles y permisos | Lista de usuarios + cambio de rol + link a su perfil |
| Banear, suspender, silenciar, advertir, desbanear | Nuevo modelo `UserSanction` + aplicado/enforced |
| Gestionar reportes y apelaciones internas | UI real sobre el modelo `Report` ya creado (marcar revisado/descartado) |
| Moderación de mensajes reportados | Mismo `Report` filtrado por `targetType: "CONVERSATION"` |
| Registro de acciones del staff | Nuevo modelo `AdminActionLog`, se escribe en cada acción administrativa |
| Analítica de usuarios/actividad | Números reales básicos (no gráficos complejos todavía) |

## Qué queda PLACEHOLDER (sin sistema fuente todavía)

- Artículos de wiki (no existe módulo wiki)
- Lista pública del equipo editable (hoy es data hardcodeada en `OwnersSection`)
- TFL Coins, transacciones, recompensas (no existe módulo economía)
- Cosméticos, catálogo, precios (no existe módulo cosméticos)
- Suscripciones, beneficios, regalos (no existe módulo suscripciones)
- Streamers y clientes (no existe módulo streamers)
- Anuncios globales / notificaciones segmentadas (requiere UI de broadcast, no armada aún)
- Crear/editar/otorgar logros e insignias (no existe módulo achievements)

## Roles y permisos finos

En vez de un solo chequeo binario `role !== "ADMIN"`, se define una matriz de
permisos por sección en código (`modules/administration/permissions.ts`):

```ts
type AdminSection =
  | "dashboard" | "posts" | "modalities" | "users" | "reports"
  | "moderation" | "staffLog" | "analytics" | ...placeholders;

const SECTION_ACCESS: Record<AdminSection, Role[]> = {
  dashboard: ["MOD", "ADMIN"],
  posts: ["MOD", "ADMIN"],
  modalities: ["ADMIN"],
  users: ["ADMIN"],           // cambiar roles es solo ADMIN
  reports: ["MOD", "ADMIN"],
  moderation: ["MOD", "ADMIN"], // banear/silenciar/advertir sí, pero no cambiar roles
  staffLog: ["ADMIN"],
  analytics: ["ADMIN"],
  ...
};
```

MOD puede moderar (reportes, sanciones de usuario) pero no tocar roles de
otros usuarios ni configuración de modalidades — eso queda ADMIN-only. Esto
es lo que separa "moderación" de "administración" del sitio.

### `UserSanction`

```prisma
model UserSanction {
  id        String       @id @default(cuid())
  userId    String
  user      User         @relation(fields: [userId], references: [id])
  type      SanctionType
  reason    String       @db.Text
  issuedById String
  issuedBy   User        @relation("SanctionIssuer", fields: [issuedById], references: [id])
  expiresAt DateTime?
  revokedAt DateTime?
  createdAt DateTime     @default(now())
}

enum SanctionType { BAN SUSPEND MUTE WARNING }
```

- `BAN`/`SUSPEND` sin `expiresAt` = permanente; con `expiresAt` = temporal.
- Enforcement: el middleware (`updateSession`) chequea si el usuario tiene un
  `BAN`/`SUSPEND` activo (sin `revokedAt`, sin vencer) y si es así cierra la
  sesión y redirige a una pantalla de "cuenta suspendida". `MUTE` se chequea
  puntualmente en `sendMessage` y en `POST /api/posts` (bloquea la acción, no
  la sesión). `WARNING` no bloquea nada, es solo un registro visible en el
  perfil administrativo del usuario.
- Desbanear = crear un registro de auditoría + `revokedAt` en la sanción
  activa (no se borra el historial).

### `AdminActionLog`

```prisma
model AdminActionLog {
  id         String   @id @default(cuid())
  actorId    String
  actor      User     @relation(fields: [actorId], references: [id])
  action     String
  targetType String?
  targetId   String?
  metadata   Json?
  createdAt  DateTime @default(now())
}
```

Se escribe una entrada en cada acción administrativa relevante (sanción,
cambio de rol, publicar/archivar post, revisar reporte). Es de solo lectura
desde la UI (sección "Registro de staff"), sin edición ni borrado.

## Fuera de alcance

- Los ocho placeholders listados arriba (sin modelo de datos, se marcan
  "Próximamente" en la sidebar del admin, no clickeables o con mensaje claro).
- Gráficos de analítica avanzados — se muestran números, no charts todavía.
- Apelaciones internas de usuarios sancionados (el modelo soporta revocar
  desde el admin, pero no hay flujo de que el usuario "apele" desde su lado).
