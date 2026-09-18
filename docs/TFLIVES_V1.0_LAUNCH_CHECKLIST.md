# TFLives Web — v1.0 Launch Checklist

Playbook ejecutable para declarar **v1.0 Public Production**. Cada item incluye
responsable sugerido y comando/URL. Cerrar v0.16 no implica cerrar estos items;
marcarlos aquí a medida que se completan.

Leyenda de responsables: **Dev** (ingeniería), **Plataforma** (Vercel/Neon),
**Contenido** (equipo editorial), **Legal** (asesoría).

## 1. Dominio, TLS y redirects

- [ ] Dominio custom apuntando a Vercel con TLS activo. — *Plataforma* — Vercel → Project → Domains.
- [ ] Redirect canonical `www` ↔ apex definido a un único destino. — *Plataforma* — Vercel → Domains.
- [ ] `NEXT_PUBLIC_SITE_URL` en producción = dominio público (sin trailing slash). — *Dev* — Vercel → Settings → Environment Variables.
- [ ] Verificar cabeceras de seguridad en producción (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`). — *Dev* — DevTools → Network → Response Headers.

## 2. Search Console y SEO

- [ ] Propiedad del dominio verificada en Google Search Console. — *Dev* — https://search.google.com/search-console
- [ ] `https://<dominio>/sitemap.xml` enviado. — *Dev* — GSC → Sitemaps.
- [ ] `https://<dominio>/robots.txt` responde y excluye superficies privadas. — *Dev* — navegador.
- [ ] Lighthouse desktop+mobile ≥ 90 en Performance/SEO para las rutas clave. — *Dev* — `docs/TFLIVES_V0.16_QA_AUDIT.md`.

## 3. Analytics y privacidad

- [ ] Decisión de analytics acorde a v0.14 (self-hosted o privacy-friendly). — *Dev/Legal* — ver `docs/TFLIVES_V0.14_LEGAL_PRIVACY_SAFETY.md`.
- [ ] Si aplica script externo, sumarlo a la CSP (`script-src`/`connect-src`). — *Dev* — `next.config.ts`.
- [ ] Sin cookies de tracking de terceros no declaradas. — *Dev/Legal* — revisión de runtime.

## 4. Legal activo

- [ ] Privacidad, términos, cookies, aviso legal y normas accesibles desde el footer en es/en. — *Dev/Legal* — `/es/privacidad`, `/es/terminos`, `/es/cookies`, `/es/aviso-legal`, `/es/normas`.
- [ ] Revisión legal del texto con asesoría. — *Legal* — documentos en `messages/{es,en}.json` + páginas marketing.
- [ ] Aviso de cookies visible en primera visita. — *Dev* — `/es`.

## 5. Contenido mínimo inicial (datos no-PII)

- [ ] Wiki: artículos base publicados. — *Contenido* — `/es/network/wiki`.
- [ ] Posts de red publicados. — *Contenido* — `/es/network`.
- [ ] Equipo (`Team`) y streamers activos cargados. — *Contenido* — `/es/equipo`, `/es/streamers`.
- [ ] Cosméticos, logros y wallet de lanzamiento configurados. — *Contenido* — `/admin`.
- [ ] Modalidades y estado del servidor verificados. — *Contenido* — `/es/network/estado`.

## 6. Base de datos y rollback

- [ ] Backup lógico previo al lanzamiento (`pg_dump`) guardado fuera del repo. — *Dev* — `docs/TFLIVES_V0.15_PRODUCTION_HARDENING.md` §5.
- [ ] `npx prisma migrate deploy` aplicado con `DATABASE_URL` real. **Nunca** `db:push`. — *Dev* — Neon.
- [ ] Último commit estable pinneado (tag `v1.0.0`). — *Dev* — `git tag v1.0.0`.
- [ ] Restore de Neon probado (branch desde punto previo). — *Plataforma* — Neon Console.
- [ ] Rollback documentado: revertir código + mantener migraciones aditivas. — *Dev* — v0.15 §Migración.

## 7. Verificación previa al anuncio

- [ ] Suite completa en verde: `npm run typecheck; npm run lint; npm test; npm run build; npm run test:e2e; npm run test:integration`. — *Dev*.
- [ ] `package.json` en `1.0.0`. — *Dev*.
- [ ] Smoke manual: login (email + OAuth), perfil, mensajería, admin. — *Dev*.

## 8. Post-launch (primera semana)

- [ ] Monitorizar errores de cliente en `/admin/analytics` (columna `source = client`). — *Dev* — diario.
- [ ] Latencia p95 y errores 5xx. — *Plataforma* — Vercel Analytics/Logs.
- [ ] Hits de rate limit y 429 inesperados. — *Dev* — `/admin/analytics`.
- [ ] Uso de conexiones Neon (free tier = 5; `connection_limit=3&pool_timeout=20`, no tocar). — *Plataforma* — Neon Console.
- [ ] Cobertura de Search Console (indexación, errores). — *Dev* — GSC.
