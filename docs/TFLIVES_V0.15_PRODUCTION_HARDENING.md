# TFLives Web — v0.15.0 Production Hardening

Release de endurecimiento de producción. Cierra cinco brechas operativas sobre
la base v0.14 (Legal, Privacy & Safety) sin tocar flujos de producto.

## Alcance

1. Pruebas end-to-end mínimas de los flujos principales.
2. Monitoreo de errores de cliente (self-hosted, sin proveedor externo).
3. Rate limiting DB-backed por ruta para endpoints sensibles.
4. Alineación de versión del proyecto.
5. Plan de backups y restauración documentado.

---

## 1. End-to-end (regla 12)

`tests/e2e/smoke.test.ts` levanta el build de producción con `next start` contra
un PostgreSQL aislado en memoria (PGlite) en puertos propios (HTTP `3108`,
socket `55438`) y **nunca** usa `DATABASE_URL` real.

Cubre: registro → sesión → `PATCH /api/profile` → perfil público; login →
`/en/configuracion`; ingesta de errores de cliente; rate limit (429); escrituras
sin sesión (401); y la guarda optimista de `/admin` (redirect a login).

```powershell
npm run build
npm run test:e2e
```

El harness requiere un build fresco. No forma parte de `npm test` (unit tests)
para no encarecer el ciclo normal.

### Actualización de la suite de integración

`tests/integration/network-content.test.ts` acumulaba fallos preexistentes (no
introducidos por v0.15; se verificó que fallaban también en HEAD). Se alineó con
el comportamiento documentado de Next 16 con Cache Components:

- `notFound()` en páginas que stremean tras el boundary de `[locale]/loading.tsx`
  devuelve `200` + `<meta name="robots" content="noindex">` en vez de `404`
  (helper `assertNotFound`). Lo mismo para `redirect()` (`200` + destino en el
  body, helper inline).
- Las páginas cacheadas (`use cache`) sirven stale-while-revalidate tras una
  mutación: las comprobaciones de contenido inmediato usan los helpers
  `eventuallyIncludes`/`eventuallyExcludes` (poll corto).
- Rutas obsoletas corregidas (`/es/tienda` → `/es/network/tienda`) y
  aserciones con shape de API desactualizado (notificación de mensaje keyed por
  conversación; logros anidados en `item.achievement.name`).

La suite de integración queda verde.

## 2. Monitoreo de errores de cliente

Pipeline self-hosted que reutiliza el pipeline de errores del servidor
(`captureApplicationError`) y agrega una columna `source` (`server` | `client`)
a `ApplicationError`.

Componentes:

- `src/instrumentation-client.ts`: instala `error` y `unhandledrejection` antes
  de la hidratación. Envuelto en `try/catch`; nunca rompe el bootstrap.
- `src/shared/observability/client-error.ts`: reporter fire-and-forget
  (`navigator.sendBeacon` primero, `fetch` con `keepalive` como fallback).
- `src/app/global-error.tsx`: boundary raíz (reemplaza el layout, incluye
  `<html>`/`<body>`). Resuelve el idioma desde el pathname porque el provider de
  next-intl no existe en ese nivel.
- `src/app/[locale]/error.tsx`: reporta errores de segmento.
- `POST /api/observability/client-error`: endpoint público, validado,
  rate-limited por IP y sanitizado (`sanitizeApplicationErrorMessage`).

Privacidad: no se guardan stacks, cuerpos de request, URLs, identificadores de
cuenta ni IPs crudas. El mensaje se sanitiza a 240 caracteres; la IP solo se usa
(hasheada) como clave de rate limit.

El admin ya lista estos errores en `/admin/analytics` (columna `area`, con
`source` seleccionado para inspección).

## 3. Rate limiting DB-backed

`src/infrastructure/rate-limit/service.ts` implementa una ventana fija atómica
(upsert `ON CONFLICT`) sobre `RateLimitCounter`. Las claves se hashean con
`BETTER_AUTH_SECRET`; no se persisten IPs ni userIds crudos.

- Falla abierto: un problema de base de datos nunca bloquea una ruta.
- Purga best-effort de contadores viejos (>24 h) con probabilidad 1/256.
- Better Auth conserva sus propios límites para rutas de auth.

Buckets activos (`RATE_LIMITS`): `client-errors`, `community-report`,
`messaging-report`, `chat-report`, `appeals`, `comments`, `reactions`,
`chat-global`, `posts`, `messaging-send`, `social-follow`, `social-friends`.

Rutas con guard aplicado: errores de cliente, reportes (community/messaging/
chat), apelaciones, comentarios, reacciones, chat global, publicaciones,
envío de mensajes y follows/friends. Para sumar una ruta:

```ts
const limited = await enforceRateLimit("comments", authUser.id);
if (limited) return limited;
```

## 4. Versión

`package.json` → `0.15.0`. README raíz corregido a Next.js 16 (estaba en 15).

## 5. Backups y restauración (Neon PostgreSQL)

### Estrategia recomendada

| Capa | Mecanismo | Retención | Dueño |
| --- | --- | --- | --- |
| PITR (nativo) | Neon branching / point-in-time restore | Según plan de Neon | Plataforma |
| Snapshot manual | `pg_dump` a almacenamiento externo | 30 días rolling | Dev |
| Export de esquema | `prisma migrate` versionado en git | indefinida | Dev |

### Backup lógico

```powershell
# Usar la URL real de Neon (nunca commitearla). Preferir una branch de lectura.
$env:DATABASE_URL = "postgresql://...@...neon.tech/tflives?sslmode=require"
pg_dump --no-owner --no-privileges --format=custom --file "backup-tflives-$(Get-Date -Format yyyyMMdd-HHmm).dump" $env:DATABASE_URL
```

Guardar el `.dump` fuera del repo (no está gitignoreado el patrón, pero aplica
la regla de no commitear artefactos). Verificar integridad:

```powershell
pg_restore --list backup-tflives-YYYYMMDD-HHmm.dump | Select-Object -First 20
```

### Restauración

1. Crear una branch de Neon desde el punto previo (más rápido y sin downtime).
2. Para restore completo sobre una base vacía:

```powershell
pg_restore --clean --if-exists --no-owner --no-privileges --dbname $env:DATABASE_URL backup-tflives-YYYYMMDD-HHmm.dump
```

3. Re-aplicar migraciones pendientes: `npx prisma migrate deploy`.
4. Validar: `npm run test:integration` (usa PGlite, no producción) y smoke manual
   de login + perfil + `/admin/analytics`.
5. Rotar secretos si el incidente fue de seguridad y revocar sesiones.

### Cadencia

- Backup lógico diario en horario valle + antes de cada `migrate deploy`.
- Probar una restauración real al menos una vez por release mayor.
- Documentar el RTO/RPO objetivo en el runbook del equipo.

## Migración

`prisma/migrations/20260921000000_production_hardening` es aditiva:
`ALTER TABLE "ApplicationError" ADD COLUMN "source"` con `DEFAULT 'server'` y la
tabla `RateLimitCounter`. No hay cambios de enum, así que es transaction-safe.

```powershell
npx prisma migrate deploy   # producción (DATABASE_URL real)
```

Rollback: al ser aditiva, revertir código es seguro sin bajar la migración; el
`source` default y la tabla extra no afectan versiones anteriores.
