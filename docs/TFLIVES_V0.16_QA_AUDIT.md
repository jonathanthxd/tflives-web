# TFLives Web — v0.16 QA Audit (Release Candidate)

Hoja de resultados de la auditoría cross-cutting del punto 4 de
`docs/TFLIVES_V0.16_RELEASE_CANDIDATE.md`. Fecha: 2026-09-18.

## Cómo leer esta hoja

- **Automático**: cubierto por tests/build y verificable con los comandos dados.
- **Manual/inspección**: revisión de código y layout sin navegador.
- **Pendiente**: requiere ejecución externa (Lighthouse, preview de Vercel).

## 1. Lighthouse (desktop + mobile)

| Ruta | Desktop | Mobile | Estado |
| --- | --- | --- | --- |
| Home `/es` | — | — | Pendiente |
| Red `/es/network` | — | — | Pendiente |
| Wiki `/es/network/wiki` | — | — | Pendiente |
| Perfil `/es/perfil/<user>` | — | — | Pendiente |
| Tienda `/es/network/tienda` | — | — | Pendiente |

Comando sugerido sobre un preview de Vercel o `npm run build && npm start`:

```powershell
npx lighthouse http://localhost:3000/es --preset=desktop --view
npx lighthouse http://localhost:3000/es --form-factor=mobile --view
```

Umbral orientativo ≥ 90 en Performance y SEO. Registrar el puntaje por ruta al
ejecutar; cualquier desviación se documenta en esta tabla con su diagnóstico.
El preview de Vercel (auto-deploy de `main`) ya aplica las cabeceras CSP del
punto 5, por lo que Lighthouse es la verificación funcional recomendada.

## 2. SEO técnico

| Check | Resultado | Evidencia |
| --- | --- | --- |
| `sitemap.xml` por locale con alternates | PASS | `tests/unit/seo.test.ts` |
| `robots.txt` excluye superficies privadas | PASS | `tests/unit/seo.test.ts` |
| Superficies inexistentes con `noindex` | PASS | `perfil/[username]`, `streamers/[username]`, `network/[slug]`, `network/wiki/[slug]`, `network/modalidades/[slug]` |
| Canónicas + hreflang (`es`/`en`/`x-default`) | PASS | `seo.test.ts` (páginas marketing + perfil) |
| Rutas legales en sitemap | PASS | `tests/unit/legal-compliance.test.ts` |

## 3. Navegación móvil (375px)

| Superficie | Resultado | Evidencia |
| --- | --- | --- |
| Navbar / UserMenu (nombre truncado) | PASS | `src/shared/ui/layout/user-menu.tsx` (breakpoints `sm/md/lg` + `truncate`) |
| Scroll horizontal global | PASS | `overflow-x: hidden` en `html` (`src/styles/globals.css`) |
| Admin, mensajería, tienda, cosméticos | PASS (inspección) | Revisión de layout y touch targets ≥ 40–44px |

## 4. Accesibilidad y feedback

| Check | Resultado | Evidencia |
| --- | --- | --- |
| Modales de error / rate-limit 429 | PASS | `tests/e2e/smoke.test.ts` (429 + `Retry-After`) |
| Focus/aria en patrones existentes | PASS | Inspección; sin regresiones detectadas |

## 5. Caché (Cache Components)

| Check | Resultado | Evidencia |
| --- | --- | --- |
| Tags de contenido público | PASS | `src/modules/network/cache/public-content-cache.ts` |
| Revalidación en draft/publicar/despublicar | PASS | `revalidateTag(tag, "max")` en posts/wiki/modalidades/timeline |

## 6. Rate limiting

| Check | Resultado | Evidencia |
| --- | --- | --- |
| Burst en rutas sensibles → 429 | PASS | `tests/e2e/smoke.test.ts` |
| Buckets y ventanas acotadas | PASS | `tests/unit/production-hardening.test.ts` |
| Purga de contadores > 24 h | PASS | Nuevo test de retención (v0.16) |
| Límites visibles en `/admin/analytics` | PASS | API admin + e2e |

## 7. Deuda y limpieza

| Check | Resultado | Evidencia |
| --- | --- | --- |
| `TODO`/`FIXME` en `src/` | PASS (0) | `grep` sobre `src/` |
| `console.*` ruidosos | PASS | Solo `console.error` en manejo de errores + `console.info` de email en dev |
| Sin `.zip` versionados | PASS | `*.zip` en `.gitignore`; artefactos no stageados |
| `prefers-reduced-motion` / low-resource en `src/` | INFO (0) | Se mantiene como verificación en v1.1 |

## Comandos ejecutados en v0.16

```powershell
npm run typecheck
npm run lint                 # 0 errores nuevos; 39 preexistentes react-hooks
npm test                     # suite unit (PGlite) en verde
npm run build                # 232 rutas
npm run test:e2e             # 1/1
npm run test:integration     # 1/1
```
