# TFLives Web — v0.13.0 Performance & SEO

Directiva compacta de referencia. Release de rendimiento, metadatos y SEO técnico
sobre la base v0.12 (UX, Accessibility & Responsive). No añade producto nuevo.

## Alcance

1. Metadatos canónicos, hreflang y OpenGraph por página.
2. `sitemap.xml` dinámico por locale.
3. `robots.txt` con superficies privadas excluidas.
4. `manifest.webmanifest` instalable y locale-aware.
5. JSON-LD estructurado (Organization, WebSite, Person, Article, BreadcrumbList).
6. Caché de contenido público con Cache Components y revalidación por tag.
7. Fuentes self-hosted y `noindex` en entidades inexistentes.

## Fuentes de verdad

```text
src/config/site.ts              # siteConfig, absoluteUrl, localePath, alternatesFor
src/shared/seo/routes.ts        # staticSeoRoutes (rutas públicas indexables)
src/shared/seo/schema.ts        # builders JSON-LD
src/shared/seo/json-ld.tsx      # render + escape de payloads
src/app/sitemap.ts              # sitemap por locale + contenido dinámico
src/app/robots.ts               # reglas de rastreo
src/app/manifest.ts             # PWA manifest
src/app/[locale]/opengraph-image.tsx
src/app/[locale]/twitter-image.tsx
```

## Metadatos y canonical

- `siteMetadata` define `metadataBase`, título, descripción, OG/Twitter y
  `robots` por defecto (`index, follow`).
- Toda página pública con `generateMetadata` expone `alternates` vía
  `alternatesFor(locale, path)` → `canonical` + `languages` (`es`, `en`,
  `x-default` apuntando al locale por defecto).
- `NEXT_PUBLIC_SITE_URL` fija el origen canónico; sin él cae a
  `https://www.tflives.com` (`src/config/site.ts`).

## Sitemap y robots

- `src/app/sitemap.ts` hace `await connection()` (compatible con
  `cacheComponents`) y combina `staticSeoRoutes` con entradas dinámicas de posts,
  wiki, modalidades, streamers y perfiles (`Promise.allSettled`, `take` acotado).
- Cada entrada se emite por locale con `alternates.languages`.
- `src/app/robots.ts` permite `/` y bloquea `admin`, `mensajes`, `amigos`,
  `configuracion`, `suscripcion`, `login/register/recuperación`, `onboarding`,
  `cosmeticos` y `/api/`. Enlaza el sitemap y fija `host`.

## Structured data

- Builders puros y testeables: `organizationNode`, `websiteNode`, `personNode`,
  `articleNode`, `breadcrumbNode`, `jsonLdGraph`.
- `json-ld.tsx` inserta el grafo con `dangerouslySetInnerHTML` y escapa `<` como
  `\u003c` para evitar cierres de script.

## Caché y revalidación

- `src/modules/network/cache/public-content-cache.ts` usa `cacheTag` por dominio
  (`PUBLIC_CONTENT_TAGS.posts | modalities | timeline | wiki`).
- Las mutaciones llaman `revalidateTag(tag, "max")` en:
  - posts (`api/posts`, `api/posts/[id]`);
  - wiki y categorías (`api/admin/wiki*`);
  - modalidades (`api/modalities*`);
  - timeline (`api/admin/timeline*`).

## Varios

- Tipografías cargadas con `next/font/google` (self-hosted en build, sin
  peticiones a Google en runtime).
- Entidades inexistentes devuelven `robots: { index: false }` en perfil,
  streamer, post de red, wiki y modalidad.
- Deuda conocida: se mantienen `<img>` en varias vistas (warnings
  `@next/next/no-img-element`); migrar a `next/image` queda fuera de v0.13.

## Verificación

```powershell
npm run typecheck
npm test        # tests/unit/seo.test.ts, tests/unit/legal-compliance.test.ts
npm run build
```

La auditoría Lighthouse desktop/mobile de las rutas clave se ejecuta y registra
en v0.16 (`docs/TFLIVES_V0.16_QA_AUDIT.md`).
