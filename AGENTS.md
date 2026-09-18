<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repo-specific notes

TFLives web: Next.js 16.3.5 + React 19 + Tailwind, Prisma → PostgreSQL en Neon, Better Auth, next-intl (es/en). Doc del proyecto en `docs/` (español) y README por módulo en `src/modules/*/README.md`. README.md raíz está desactualizado (dice Next 15; el repo es Next 16.3.5).

## Comandos (en cada cambio)
- `npm run typecheck` y `npm run lint` antes de commitear.
- `npm run build` = `prisma generate && next build` (regenera el cliente Prisma). Lento, ~3–4 min.
- ¿Cambiaste `prisma/schema.prisma`? Corre `npm run db:generate`; typecheck/build fallan sin cliente fresco.
- Aplicar migraciones a producción: `npx prisma migrate deploy` (usa `DATABASE_URL` real de Neon). **Nunca uses `npm run db:push` contra producción.**

## Tests
- `npm test`: 82 unit tests sobre PGlite (Postgres en memoria). Lento (~2 min); el flag `--import tests/helpers/server-only.mjs` es obligatorio y ya está en el script.
- Archivo suelto: `npx tsx --import ./tests/helpers/server-only.mjs --test tests/unit/<archivo>.test.ts`
- Los tests aplican los `prisma/migrations/*/migration.sql` crudos a PGlite. Cada archivo de test lista su propio array `MIGRATIONS` curado: **las migraciones nuevas NO se incluyen solas**; añádelas a mano y añade también los valores de enum nuevos que introduzcan (ver `migratedCosmeticsDatabase()` en `tests/unit/cosmetics.test.ts`).
- Integración: primero `npm run build`, luego `npm run test:integration` (levanta Postgres local en puertos 55439/3109; nunca usa `DATABASE_URL` configurada).

## Gotchas de Prisma/Postgres
- **Trampa de enum:** Postgres no permite usar un valor de enum recién añadido en la misma transacción (error 55P04/P3018). `ALTER TYPE ... ADD VALUE` + `UPDATE`/`INSERT` con ese valor falla bajo las migraciones transaccionales de Prisma. Al cambiar un enum usa el patrón transaction-safe del `20260917000000_cleanup_enums_and_message`: CREATE nuevo tipo → columna temporal → UPDATE con CASE → DROP columna → RENAME → DROP tipo viejo. Si una migración ya falló, `npx prisma migrate resolve --rolled-back <id>` destraba el siguiente `migrate deploy`.
- Neon free tier = 5 conexiones; `src/infrastructure/database/prisma.ts` fija `connection_limit=3&pool_timeout=20`. Mantén eso y usa `Promise.allSettled` para fan-out en vez de await serial.

## Específico de Next.js 16 (además del bloque de arriba)
- `next.config.ts` activa `cacheComponents: true` y `partialPrefetching: true`. Para sacar un route group del prerender instantáneo se exporta `export const instant = false` en su `layout.tsx` (ver `src/app/[locale]/(account)/layout.tsx`). No uses `dynamic = "force-dynamic"` (incompatible con estos flags; commit `b7a1533`).
- Páginas que lean `headers()`/`cookies()`/BD durante prerender solo son seguras dentro de Suspense o de un boundary `instant = false`; los server components que leen `params`/`searchParams` fuera de Suspense también deben opt out.
- El middleware está en `src/proxy.ts` (no `middleware.ts`): combina enrutado de locale (next-intl) + guarda optimista por cookie para `/admin`. La sesión y permisos reales SIEMPRE se validan de nuevo server-side.
- Rutas API (sin locale) en `src/app/api/*`; rutas con locale bajo `src/app/[locale]/...` con route groups `(account)`, `(administration)`, `(marketing)`, `(platform)`.

## Auth y i18n
- Better Auth vive en `src/infrastructure/auth/`. El código server-side debe usar `getCurrentAuthUser()` de `@/infrastructure/auth/server` — retorna `null` (no lanza) cuando no hay sesión/headers. No hagas que lance.
- Todo texto de UI va por next-intl; `messages/es.json` y `messages/en.json` deben quedar en paridad llave-por-llave (tests unitarios lo validan por namespace). Toda key/namespace nuevo va en AMBOS archivos. Nunca hardcodees texto visible.
- Arquitectura: `src/modules/*` features, `src/infrastructure/*` transversales, `src/shared/*` reutilizable. Mantén esa separación.

## Mantenimiento
- Los `*.zip` sueltos en la raíz NO están gitignoreados; ya se han colado en commits antes. No los stagges (`.zip` de respaldo/artefactos).
- `.env` tiene credenciales reales de Neon y Better Auth; está gitignoreado pero nunca lo imprimas ni lo loguees.