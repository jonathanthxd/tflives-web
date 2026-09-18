# Changelog de desarrollo — TFLives Web

_(Este archivo es solo un borrador de trabajo para el post de Discord, no forma parte del producto.)_

## v0.16.0 — Release Candidate

- CI de GitHub ahora corre la suite unitaria (PGlite) además de lint, typecheck y build.
- Cabeceras de seguridad en producción, incluida una `Content-Security-Policy`.
- Fix móvil: el nombre de usuario se trunca correctamente en el navbar y se elimina el scroll horizontal.
- `.env.example` en paridad (`NEXT_PUBLIC_SITE_URL`) y README con sección de tests y guía de migraciones segura.
- Documentación: specs v0.13/v0.14, hoja de auditoría QA v0.16 y checklist de lanzamiento v1.0.
- La purga de contadores viejos del rate limiter queda cubierta por test.

## v0.15.0 — Production Hardening

- Pruebas end-to-end (smoke) de los flujos principales sobre HTTP real con PostgreSQL en memoria.
- Monitoreo de errores de cliente self-hosted (`ApplicationError.source = client`).
- Rate limiting DB-backed por ruta en los endpoints sensibles.
- Plan de backups y restauración documentado (Neon).
- Versión del proyecto alineada a `0.15.0`.
