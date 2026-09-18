# TFLives Web — v0.16.0 Release Candidate
## Directiva compacta para Codex — GPT-5.6 Terra Extra High (Standard)

**Repositorio:** `C:\Users\Administrator\Desktop\web-tflives`
**Branch:** `main`
**Release:** `v0.16.0 — Release Candidate`
**Prioridad:** verificar, consolidar y dejar la rama `main` en estado de lanzamiento público (v1.0) — sin nuevas features de producto
**Estado base:** v0.15 Production Hardening completo y pusheado (commit `faf0da0`): e2e smoke harness, monitoreo de errores de cliente, rate limiting por ruta, versionado 0.15.0
**Stack obligatorio:** Next.js 16.3.5 App Router + TypeScript + Prisma + Neon PostgreSQL + Better Auth + Vercel + next-intl (es/en). NO usar `dynamic = "force-dynamic"`; usar `instant = false` + `await connection()` cuando hagan falta cookies/headers/BD durante prerender.

---

# 1. Objetivo

v0.16 es la **versión Release Candidate**: el producto ya es feature-complete y endurecido (v0.15), pero todavía no se ha probado ni consolidado como `main` lanzable a producción pública.

v0.16 NO añade features. Consolida y verifica:

- un pipeline de calidad automático y repetible (CI) con toda la suite verde;
- una auditoría cross-cutting de rendimiento, SEO, accesibilidad y móvil;
- seguridad y privacidad de nivel de lanzamiento (cabeceras, env, backups);
- documentación y versionado coherentes con el estado real;
- un checklist de lanzamiento v1.0 ejecutable paso a paso.

Al cerrar v0.16, `main` pasa a ser **v1.0 Public Production** con riesgo controlado y plan de rollback.

---

# 2. Regla de eficiencia

Haz UNA auditoría dirigida únicamente de:

- `.github/workflows/ci.yml` y scripts de `package.json` (test, test:e2e, test:integration, lint, typecheck, build);
- la suite de tests existente (unit PGlite, e2e smoke, integration network-content) y sus helpers/harness;
- `next.config.ts` (headers, security, cacheComponents, partialPrefetching) y `src/proxy.ts`;
- `.env.example` y variables de entorno consumidas por el código;
- monitoreo existente (client-error, `/admin/analytics`, rate limiting, `RateLimitCounter`);
- documentación (`README.md` raíz, `docs/`, `AGENTS.md`);
- `.gitignore` y artefactos `.zip` sueltos en la raíz.

Después implementa directamente.

NO:

- nueva feature de producto (Avatar Frames 2.0, reconciliación de logros, motion audit → pasan a **v1.1**, ver sección 10);
- auditoría global profunda del repositorio;
- refactor masivo ni reescritura de módulos funcionales;
- cambio de stack ni migración de base de datos sin justificación de seguridad;
- tocar el rate limiter ni los pipelines de errores sin un test que lo cubra;
- hardcodear texto visible (todo por next-intl, paridad es/en obligatoria).

---

# 3. CI y calidad automática

Criterios de aceptación:

- [ ] `.github/workflows/ci.yml` queda en verde en `main` y en PRs: `db:generate`, `lint`, `typecheck`, `build`, **`npm test`** (unit PGlite) como mínimo.
- [ ] Las rutas e2e/integration (necesitan build previo y Postgres local) quedan definidas como etapa separada o gate manual documentado en el README de tests — nunca bloqueando PRs sin un entorno reproducible en CI.
- [ ] `package.json` sube a `0.16.0` (vía `npm version 0.16.0` o edición manual + commit único).
- [ ] Verificable en local de un solo comando: `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e && npm run test:integration` (documentar el orden y que integration requiere build previo).
- [ ] El lint no introduce errores nuevos sobre los ya existentes (~39 avisos `react-hooks` preexistentes en archivos no tocados; no ampliarlos).

---

# 4. Auditoría de calidad (QA cross-cutting)

Criterios de aceptación:

- [ ] Lighthouse (desktop + mobile) en: home, red (`/network`), wiki, perfil, tienda. Registrar resultados hoja ruta por ruta; umbral orientativo ≥ 90 en SEO y Performance salvo diagnóstico justificado.
- [ ] Navegación móvil (375px) verificada en: admin, mensajería, tienda y tienda cosméticos.
- [ ] Patrones de a11y de pantalla ya presentes (focus, aria) re-verificados en las rutas nuevas de v0.15 (modales de error, rate-limit feedback).
- [ ] SEO: `sitemap` y `robots` funcionan; páginas de perfil inexistente sin indexar (`noindex`), alias redirigen; verificar coherencia con next-intl (rutas `/es` y `/en`).
- [ ] Caché: revalidación de contenido editorial (posts, wiki, schedule de streamers) funciona con Cache Components (tags de revalidación a prueba en flujos draft/publicar/despublicar).
- [ ] Sin regresiones en rate limiting: burst en rutas sensibles → 429; límites visibles en `/admin/analytics`.
- [ ] Verdaderos `TODO`/`FIXME` en `src/` son 0 o quedan justificados en un comentario con ticket.

Nota: la auditoría de `prefers-reduced-motion` / `motion-safe` / low-resource en `src/` ya arroja **0 resultados** (confirmado): se mantiene como verificación en v1.1, sin trabajo en v0.16.

---

# 5. Seguridad y privacidad final

Criterios de aceptación:

- [ ] Cabeceras de seguridad en `next.config.ts` (o `src/proxy.ts`) sin romper app: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors`/`X-Frame-Options`, CSP razonable que mantenga funcionando Vercel, Neon, Better Auth y script analytics eventual. Probar en `npm run build` + navegación.
- [ ] `.env.example` en paridad de variables con el código (incluye `DATABASE_URL`, `BETTER_AUTH_SECRET_URL`, `AUTH_REQUIRE_EMAIL_VERIFICATION`, etc.) y sin valores reales.
- [ ] Sin secretos ni credenciales en hooks de git, docs ni historial (verificar `git log --oneline` y que `.env` siga ignorado).
- [ ] Verificación documentada (y ejecutada 1 vez contra DB de prueba/CI) de: `pg_dump`/`pg_restore` y `npx prisma migrate deploy` con `DATABASE_URL` real de Neon — nunca `npm run db:push` contra producción (ver `docs/AUTH_NEON_MIGRATION.md` y doc v0.15).
- [ ] `RateLimitCounter` sin crecimiento infinito: política de expiración/limpieza de contadores antiguos documentada o implementada con test.

---

# 6. Documentación y versionado

Criterios de aceptación:

- [ ] `README.md` raíz coherente con el estado real (Next 16, Prisma/Neon, Better Auth, next-intl, tests, scripts). Ya corregido en v0.15; solo re-verificar.
- [ ] Creadas las specs que faltan en `docs/`: **v0.13 (Performance & SEO)** y **v0.14 (Legal, Privacy & Safety)** como directivas compactas (referencia mínima) para que `docs/` refleje el roadmap real completo.
- [ ] `docs/TFLives_Contexto_Maestro_Continuacion.md`: actualizar sección 6 (Roadmap) y marcar v0.13/v0.14/v0.15 como completados; mover las 3 tareas pendientes (#26 Avatar Frames 2.0, #27 reconciliación de logros, #28 motion audit) a una sección "v1.1 backlog".
- [ ] `docs/changelog-desarrollo.md` refleja v0.15 y v0.16.
- [ ] mensajes `es`/`en` en paridad (los tests unitarios ya lo validan por namespace; confirmar 0 fallos).

---

# 7. Deuda técnica y limpieza

Criterios de aceptación:

- [ ] `.gitignore` incluye `*.zip` (los artefactos `.zip` de la raíz ya se han colado en commits).
- [ ] Eliminado/ignorado cualquier resto de `web-tflives*.zip` en la raíz sin stagearlos.
- [ ] Sin `console.*` ruidosos en producción (revisar; mantener solo los de monitoreo intencional vía el sistema de observabilidad).
- [ ] Errores de cliente con `source=client` llegan a `/admin/analytics` (verificado en `main`).

---

# 8. Checklist de lanzamiento v1.0 (playbook)

Queda documentado en `docs/TFLIVES_V1.0_LAUNCH_CHECKLIST.md` (nuevo) como lista ejecutable, con responsable y comando/URL por item:

- [ ] Dominio custom + TLS (Vercel) y redirects canonical.
- [ ] Google Search Console: `sitemap.xml` enviado; verificación de propiedad.
- [ ] Analytics/privacidad: decisión y configuración (self-hosted o privacy-friendly acorde a v0.14).
- [ ] Legal activo (según v0.14): privacidad y términos accesibles desde el footer en es/en.
- [ ] Contenido mínimo inicial: wiki, posts, Team, streamers, cosméticos, logros y wallet de lanzamiento cargados/a menú (datos no-PII).
- [ ] Plan de rollback: `migrate deploy` idempotente + último commit estable pinneado + restore de Neon.
- [ ] Objetivos post-launch (primera semana): monitorizar errores de cliente, latencia p95, hits de rate limit y uso de conexiones (Neon free tier = 5, `connection_limit=3&pool_timeout=20` en `src/infrastructure/database/prisma.ts` — no tocar).

---

# 9. Definition of Done (v0.16)

Se cierra v0.16 (y se abre v1.0) cuando:

1. CI verde con tests unitarios incluidos y build limpio.
2. Auditoría del punto 4 registrada (hoja de resultados por ruta).
3. Cabeceras de seguridad, `.env.example` en paridad y backup/restore verificado.
4. `docs/` completo y coherente; `package.json` en `0.16.0`.
5. Checklist v1.0 creado y ejecutado hasta donde corresponde pre-lanzamiento.
6. Commits y push a `main` exclusivamente; sin `.zip` commiteados.
7. `npm run typecheck`, `npm run eslint` (archivos tocados), `npm test`, `npm run build`, `npm run test:e2e`, `npm run test:integration` en verde.

---

# 10. Fuera de alcance (backlog v1.1)

- #26 Avatar Frames 2.0 (geometrías complejas, identidad propia por frame).
- #27 Reconciliación automática de logros históricos (`reconcileAchievements(userId)`, idempotente, server-side, sin spam de notificaciones ni XP loops).
- #28 Motion audit completo (dejar constancia de que `src/` ya está limpio).
- Nuevas integraciones (pagos/Stripe/Sentry), migraciones de stack o de DB, refactors masivos.

---

# 11. Pruebas y despliegue

```text
npm run typecheck
npm run lint                    # solo archivos tocados
npm test                        # unit PGlite (~2 min)
npm run build                   # prisma generate + next build (~3-4 min)
npm run test:e2e                # requiere build previo; puertos 55438/3108
npm run test:integration        # requiere build previo; Postgres local 55439/3109; nunca DATABASE_URL real
npx prisma migrate deploy       # a producción SOLO si cambia schema (no esperado en v0.16)
```

Despliegue: Vercel auto-deploy desde `main`. v1.0 se declara cuando el checklist sección 8 esté completo y verificado.

---

# 12. Migración de datos

No se espera migración en v0.16. Si la auditoría de seguridad (sección 5) lo exigiera, aplicar el patrón transaction-safe (CREATE → columna temporal → UPDATE con CASE → DROP → RENAME → DROP tipo viejo) y nunca `ALTER TYPE ... ADD VALUE` + uso del valor nuevo en la misma transacción (error 55P04/P3018). Si una migración fallara: `npx prisma migrate resolve --rolled-back <id>` antes del siguiente `migrate deploy`.