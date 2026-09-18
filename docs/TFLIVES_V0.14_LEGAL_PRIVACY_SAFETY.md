# TFLives Web — v0.14.0 Legal, Privacy & Safety

Directiva compacta de referencia. Release legal y de privacidad sobre la base
v0.13 (Performance & SEO). No añade producto nuevo: formaliza páginas legales,
consentimiento y canales de contacto.

## Alcance

1. Páginas legales bilingües (es/en) accesibles y con metadata.
2. Aviso de cookies informativo y descartable.
3. Aceptación explícita de términos y privacidad en el registro.
4. Contacto por Discord (sin buzones ficticios).
5. Enlaces legales en el footer y suma al sitemap.

## Fuentes de verdad

```text
src/shared/ui/legal-page.tsx         # shell compartido (pt-28, evita solape con navbar)
src/shared/ui/cookie-notice.tsx      # aviso informativo
src/app/[locale]/(marketing)/privacidad/page.tsx
src/app/[locale]/(marketing)/terminos/page.tsx
src/app/[locale]/(marketing)/cookies/page.tsx
src/app/[locale]/(marketing)/aviso-legal/page.tsx
src/app/[locale]/(marketing)/normas/page.tsx
messages/es.json, messages/en.json    # namespaces Privacy, Terms, Cookies, CookieNotice, LegalNotice, CommunityGuidelines
```

## Páginas legales

- Rutas: `/privacidad`, `/terminos`, `/cookies`, `/aviso-legal`, `/normas`.
- Cada página declara `export const instant = false;`, `generateMetadata` con
  `alternatesFor` y su namespace de next-intl (paridad es/en validada por tests).
- Reutilizan `LegalPage` para espaciado consistente bajo el navbar fijo.

## Cookies y consentimiento

- `CookieNotice` es informativo (no bloquea navegación), descartable y persiste la
  decisión en `localStorage`; enlaza a `/cookies`.
- Se renderiza globalmente desde `src/app/[locale]/layout.tsx`.
- No hay cookies de tracking de terceros: la decisión de analytics privacy-friendly
  se ejecuta en el checklist de lanzamiento (v1.0).

## Registro y contacto

- El registro exige `acceptedTerms` antes de llamar a `authClient.signUp.email`
  (el gate precede al alta) y enlaza términos/privacidad.
- El contacto legal apunta a `DISCORD_INVITE`; no existen buzones
  `privacy@/legal@tflives.com`.
- El footer enlaza las cinco páginas legales.

## Privacidad de datos

- Avatares/banners en PostgreSQL (`ProfileAsset`), 2 MB máx., PNG/JPEG/WebP.
- El pipeline de errores no guarda stacks, cuerpos, URLs, identificadores ni IPs
  crudas (ver v0.15, sección 2).
- Identidades del rate limiter hasheadas con `BETTER_AUTH_SECRET`.

## Verificación

```powershell
npm test        # tests/unit/legal-compliance.test.ts + paridad i18n
npm run build
```

## Pendiente para lanzamiento (v1.0)

- Decisión y configuración de analytics acorde a esta release.
- Revisión legal del texto con asesoría antes de operar a escala (ver
  `docs/TFLIVES_V1.0_LAUNCH_CHECKLIST.md`).
