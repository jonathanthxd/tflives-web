# Reestructuración a arquitectura modular por dominios — Plan de migración

**Fecha**: 2026-07-31
**Estado**: Propuesto, pendiente de aprobación — no se movió ningún archivo todavía.

## Alcance acordado

- **No es monorepo**: el proyecto sigue siendo una sola app Next.js en la raíz del repo. Se reorganiza el contenido de `src/`, no la raíz del repo. `next.config.ts`, `package.json`, `tailwind.config.ts`, etc. quedan donde están (Next.js los requiere ahí).
- **`[locale]` es solo estructura de carpetas**, sin librería de i18n todavía. Para que el sitio siga funcionando (Next.js App Router trata `[locale]` como segmento dinámico obligatorio), se agrega:
  - Un middleware mínimo que redirige `/` → `/es/...` (todo el contenido sigue en español, fijo).
  - `app/[locale]/layout.tsx` valida que el segmento sea `"es"` (único soportado por ahora) y llama `notFound()` si no. Cuando se implemente i18n real (tarea aparte, no ahora), este layout es el punto donde se conecta.
- Cada `page.tsx`/`layout.tsx`/`route.ts` sigue viviendo bajo `app/` (Next.js lo exige para el routing). Lo que se mueve a `modules/` es la lógica real: componentes, validaciones, llamadas a Better Auth/Prisma. Las páginas quedan como wrappers finos que importan del módulo correspondiente.

## Hallazgos durante el inventario

- `src/components/effects/hyperspace-warp-drive.tsx` (197 líneas) — **no lo importa nada en todo el repo**. Código muerto de una iteración de diseño anterior. Propuesta: **borrarlo**, no migrarlo.
- La llamada a la API de Discord en `app/api/discord/route.ts` es lógica de integración externa reutilizable — se extrae a `infrastructure/external-services/discord.ts`.
- El upload de avatar/banner (hoy duplicado conceptualmente, aunque solo vive en un lugar tras el merge con `/perfil`) se extrae a un helper en `infrastructure/storage/`.

## Puntos que necesito que confirmes (decisiones de encaje, no triviales)

1. **`discord-widget.tsx`, `ambient-background.tsx`, `hero-glow.tsx`**: no son de ningún dominio de negocio (son efectos visuales/widget de marketing). Propongo `shared/ui/effects/`. ¿Ok?
2. **`navbar.tsx`, `footer.tsx`, `auth-header.tsx`, `user-menu.tsx`**: son chrome global del sitio, no de un dominio específico. Propongo `shared/ui/layout/`. `admin-sidebar.tsx` sí es específico de administración → `modules/administration/components/`.
3. **Los placeholders "Próximamente" que ya existen** (Amigos/Seguidores en perfil, Logros, Cosméticos, ítems del menú de usuario) — los extraigo de `profile-view.tsx`/`user-menu.tsx` a componentes chicos dentro de sus módulos (`modules/social/components/friends-placeholder.tsx`, `modules/achievements/components/badges-placeholder.tsx`, `modules/cosmetics/components/cosmetics-placeholder.tsx`) para que estén en el lugar correcto desde ya, aunque no tengan datos reales todavía.
4. **Módulos sin ningún código hoy** (roles, wiki, community, chat, messaging, notifications, streamers, economy, subscriptions, moderation, analytics): se crean vacíos con un `README.md` de una línea indicando su fase (según el orden que ya definiste vos: users→auth→roles→profiles→social/streamers/mensajería/notificaciones→badges/reports→wallets/cosméticos/suscripciones→analítica). Nada de código de mentira ni funciones que no existen.

## Mapeo completo archivo por archivo

### `app/` (reorganizado bajo `[locale]` + grupos de rutas)

| Actual | Nuevo |
|---|---|
| `app/layout.tsx` | `app/[locale]/layout.tsx` (+ nuevo `app/layout.tsx` raíz mínimo si Next.js lo requiere para metadata compartida — a confirmar en la ejecución) |
| `app/page.tsx` | `app/[locale]/(marketing)/page.tsx` |
| `app/(marketing)/network/page.tsx` | `app/[locale]/(marketing)/network/page.tsx` |
| `app/(marketing)/network/[slug]/page.tsx` | `app/[locale]/(marketing)/network/[slug]/page.tsx` |
| `app/perfil/[username]/page.tsx` | `app/[locale]/(platform)/perfil/[username]/page.tsx` |
| `app/login/page.tsx` | `app/[locale]/(account)/login/page.tsx` |
| `app/register/page.tsx` | `app/[locale]/(account)/register/page.tsx` |
| `app/forgot-password/page.tsx` | `app/[locale]/(account)/forgot-password/page.tsx` |
| `app/reset-password/page.tsx` | `app/[locale]/(account)/reset-password/page.tsx` |
| `app/onboarding/username/page.tsx` | `app/[locale]/(account)/onboarding/username/page.tsx` |
| `app/auth/callback/route.ts` | `app/[locale]/(account)/auth/callback/route.ts` (o `app/api/auth/callback` si preferís sacarlo del árbol de locale — a confirmar) |
| `app/(admin)/layout.tsx` | `app/[locale]/(administration)/admin/layout.tsx` |
| `app/(admin)/admin/page.tsx` | `app/[locale]/(administration)/admin/page.tsx` |
| `app/(admin)/admin/posts/page.tsx` | `app/[locale]/(administration)/admin/posts/page.tsx` |
| `app/(admin)/admin/posts/new/page.tsx` | `app/[locale]/(administration)/admin/posts/new/page.tsx` |
| `app/api/*` | Sin cambios — las API routes quedan en `app/api/` (fuera de `[locale]`, no tiene sentido versionarlas por idioma). |
| `app/globals.css` | `styles/globals.css` |
| `app/favicon.ico` | Sin cambios |
| `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts` | **No existen hoy** — se crean vacíos/básicos si querés (no estaba pedido antes de este mensaje; lo sumo a la estructura pero con contenido mínimo real, no relleno). |

### `modules/`

| Módulo | Contenido que se mueve |
|---|---|
| `authentication/` | `infrastructure/auth/client.ts` queda en infra; lo que se mueve acá: `lib/validations/auth.ts` (menos `flattenZodErrors`, que es genérico → shared), `components/auth/oauth-buttons.tsx` |
| `profiles/` | `components/profile/profile-view.tsx` |
| `roles/` | Vacío por ahora (el chequeo de rol ADMIN vive inline en el layout de administration hasta que roles tenga su propia lógica dedicada) — `README.md` con la fase pendiente |
| `editorial/` | `lib/validators.ts` (postSchema), lógica de `app/api/posts`, `app/api/modalities`, `components/network/post-card.tsx` |
| `network/` | Vacío por ahora — hoy "network" y "editorial" están mezclados en las mismas páginas; cuando se separen modalidades/temporadas de las noticias, esto se llena. `README.md` explicando la distinción. |
| `wiki/`, `community/`, `chat/`, `messaging/` | Vacíos, `README.md` de fase |
| `social/` | Placeholder de Amigos/Seguidores extraído de `profile-view.tsx` |
| `notifications/` | Placeholder del ícono de notificaciones extraído de `navbar.tsx` |
| `streamers/` | Vacío, `README.md` de fase |
| `achievements/` | Placeholder de Logros/insignias extraído de `profile-view.tsx` |
| `economy/` | Vacío, `README.md` de fase |
| `cosmetics/` | Placeholder de Cosméticos extraído de `profile-view.tsx` |
| `subscriptions/` | Placeholder de "Suscripción" extraído de `user-menu.tsx` |
| `moderation/` | Vacío, `README.md` de fase |
| `administration/` | `components/layout/admin-sidebar.tsx` |
| `analytics/` | Vacío, `README.md` de fase |

### `shared/`

| Carpeta | Contenido |
|---|---|
| `ui/` | `button.tsx`, `input.tsx`, `label.tsx`, `card.tsx`, `form-field.tsx`, `reveal.tsx` |
| `ui/layout/` | `navbar.tsx`, `footer.tsx`, `auth-header.tsx`, `user-menu.tsx` |
| `ui/effects/` | `ambient-background.tsx`, `hero-glow.tsx`, `discord-widget.tsx` |
| `hooks/` | Vacío (no hay hooks propios todavía) |
| `utilities/` | `lib/utils.ts` (función `cn`) |
| `validation/` | `flattenZodErrors` (extraído de `lib/validations/auth.ts`, es genérico) |
| `constants/` | `MINIMAL_HEADER_ROUTES` (extraída de `navbar.tsx`) |
| `types/` | Vacío por ahora (no hay tipos cross-dominio que valga la pena forzar a extraer todavía) |

### `infrastructure/`

| Carpeta | Contenido |
|---|---|
| `database/` | `lib/prisma.ts` |
| `auth/` | `infrastructure/auth/client.ts`, `auth.ts`, `server.ts` y `email.ts` |
| `storage/` | Nuevo helper extraído de la lógica de upload de avatar/banner en `profile-view.tsx` |
| `realtime/`, `cache/`, `logging/` | Vacíos, `README.md` (nada implementado, no es de ningún módulo tampoco) |
| `external-services/` | Lógica de `app/api/discord/route.ts` extraída a `discord.ts` |

### `config/`, `providers/`, `styles/`

| Carpeta | Contenido |
|---|---|
| `config/` | Nuevo `site.ts` con las constantes de metadata (nombre, descripción) hoy hardcodeadas en `app/layout.tsx` |
| `providers/` | `components/theme-provider.tsx` |
| `styles/` | `app/globals.css` |

### `tests/`

Vacío — no hay tests hoy (regla 12 del proyecto los pide para reglas críticas de negocio, pero no existen todavía). Se crean las 4 carpetas con `README.md` explicando qué va en cada una, para cuando se empiecen a escribir.

## Riesgos y qué se verifica después de mover todo

- Cientos de imports rotos (`@/components/...` → `@/modules/...` o `@/shared/...`) — hay que actualizar cada `import` uno por uno. Alto volumen, mecánico, pero con riesgo de error humano si se hace a mano — lo hago archivo por archivo con verificación de `tsc` después de cada bloque grande.
- El movimiento de `globals.css` fuera de `app/` requiere confirmar que el `@import`/`<link>` en `app/[locale]/layout.tsx` sigue resolviendo bien con Tailwind (el `content` glob de `tailwind.config.ts` también hay que actualizarlo para que siga escaneando `src/modules/**` y `src/shared/**`, si no las clases nuevas dejan de generarse).
- El `[locale]` agregado cambia todas las URLs (`/login` pasa a `/es/login`). Hay que decidir si querés que la URL pública muestre el prefijo `/es/` desde ya, o si preferís ocultarlo mientras solo haya un idioma (Next.js soporta "locale prefijo solo cuando hace falta", pero eso ya es empezar a tocar i18n real, que dijiste que no querías todavía). **Por defecto voy a mostrarlo (`/es/login`) ya que es la opción más simple sin librería de i18n.**
- Voy a verificar con `npm run typecheck`, `npm run lint`, `npm run build` y una pasada visual en navegador después de terminar todo el movimiento, antes de dar la tarea por terminada.

## Cómo lo ejecuto

Dado el volumen (~45 archivos + reescritura de imports + reorganización de rutas), lo hago en tandas verificables:
1. Crear toda la estructura de carpetas vacía (incluye los `README.md` de fase).
2. Mover `shared/` e `infrastructure/` (la base que todo lo demás importa) + actualizar imports que las usan.
3. Mover cada módulo con contenido real (authentication, profiles, editorial, administration) + actualizar imports.
4. Extraer los placeholders a sus módulos (social, achievements, cosmetics, subscriptions, notifications).
5. Reorganizar `app/` bajo `[locale]` + grupos de rutas + agregar el middleware/layout mínimo de locale.
6. Actualizar `tailwind.config.ts` (paths de contenido) y `tsconfig.json` (paths de alias, si hace falta alguno nuevo).
7. Verificación final: typecheck, lint, build, navegador.

¿Confirmás el mapeo de arriba (especialmente los 4 puntos marcados como "necesito que confirmes") para que arranque?
