# TFLives Web

Web principal y plataforma comunitaria de **TFLives / Time For Lives**.

Rendimiento v0.18: [resultados, decisiones y validación del frontend](docs/performance/V0_18.md).
Se conserva el [informe de v0.17](docs/performance/V0_17.md) y el
[protocolo de compilación aislada y pruebas visuales](docs/performance/PROTOCOL.md).

## Stack actual

- Next.js 16 + App Router
- React 19 + TypeScript
- Tailwind CSS
- PostgreSQL en Neon
- Prisma ORM
- Better Auth (email/contraseña + OAuth Google/Discord opcional)
- `next-intl` para español/inglés

La aplicación no necesita un backend de autenticación, storage o realtime adicional
para arrancar en desarrollo: la fuente de verdad es Neon y las APIs de Next.js.

## Preparar el proyecto en Windows

Desde PowerShell:

```powershell
cd $HOME\Desktop\web-tflives
Copy-Item .env.example .env
npm install
npm run db:generate
npm run dev
```

Abre `http://localhost:3000`.

## Variables mínimas

Para que la web y el login por email funcionen localmente:

```env
DATABASE_URL="TU_CONNECTION_STRING_DE_NEON"
BETTER_AUTH_SECRET="UN_SECRETO_LARGO_Y_ALEATORIO"
BETTER_AUTH_URL="http://localhost:3000"
AUTH_REQUIRE_EMAIL_VERIFICATION="false"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Puedes generar un secreto en PowerShell con:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

Consulta `.env.example` para OAuth, correo transaccional e integración con el
servidor de Discord.

## Sincronizar Prisma con Neon

Generar el cliente Prisma no modifica la base:

```powershell
npm run db:generate
```

Para crear/actualizar tablas en desarrollo usa migraciones versionadas:

```powershell
npx prisma migrate dev
```

En producción **nunca** ejecutes `npm run db:push` contra Neon. Aplica solo las
migraciones ya versionadas y con backup/branch previo:

```powershell
npx prisma migrate deploy
```

Si la base ya contiene usuarios de la arquitectura anterior, lee
`docs/AUTH_NEON_MIGRATION.md` antes de sincronizar. El plan de backups y
restauración está en `docs/TFLIVES_V0.15_PRODUCTION_HARDENING.md`.

## Autenticación

Better Auth vive en:

```text
src/infrastructure/auth/
src/app/api/auth/[...all]/route.ts
```

El esquema usa los modelos Prisma `User`, `Session`, `Account` y `Verification`.
Las contraseñas se almacenan como credenciales de Better Auth en `Account`, no en
`User`.

### Google OAuth (opcional)

Callback local:

```text
http://localhost:3000/api/auth/callback/google
```

Variables:

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### Discord OAuth (opcional)

Callback local:

```text
http://localhost:3000/api/auth/callback/discord
```

Variables:

```env
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
```

`DISCORD_SERVER_ID` y `DISCORD_BOT_TOKEN` son independientes: pertenecen a la
integración comunitaria del servidor, no al login OAuth.

## Email y recuperación de contraseña

En desarrollo puedes dejar:

```env
AUTH_REQUIRE_EMAIL_VERIFICATION="false"
RESEND_API_KEY=""
```

Sin proveedor de email, los enlaces de recuperación/verificación se muestran en
el terminal de desarrollo. Para producción configura `RESEND_API_KEY` y
`AUTH_EMAIL_FROM` (o sustituye el adaptador de correo por otro proveedor).

## Avatares y banners

Actualmente se almacenan en PostgreSQL mediante `ProfileAsset`, con límite de 2 MB
por archivo y formatos PNG/JPEG/WebP. Esto permite ejecutar la plataforma sin un
servicio de object storage. Si el volumen crece, el módulo puede migrarse a R2/S3
sin cambiar las URLs públicas del perfil de manera drástica.

## Mensajes y notificaciones

Se eliminó la dependencia de un proveedor de realtime. Por ahora:

- mensajes activos: polling aproximado cada 2.5 s;
- notificaciones: polling aproximado cada 10 s + refresco al volver a la pestaña.

`src/infrastructure/realtime/` queda como frontera para migrar más adelante a
WebSocket/SSE si la escala lo necesita.

## Comandos útiles

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e          # requiere build previo
npm run test:integration  # requiere build previo
npm run db:generate
npm run db:studio
npm run db:seed
```

## Tests

- `npm test`: tests unitarios sobre PostgreSQL en memoria (PGlite). Es el ciclo
  principal y también corre en CI.
- `npm run test:e2e`: smoke HTTP de los flujos principales. Requiere `npm run build`
  antes.
- `npm run test:integration`: aceptación HTTP de Network & Content Core. Requiere
  `npm run build` antes.

Detalles en `tests/unit`, `tests/e2e/README.md` y `tests/integration/README.md`.

## Flujo Git recomendado

```powershell
git pull
npm install
npm run dev

# después de trabajar
git status
git add .
git commit -m "feat: descripcion del cambio"
git push
```
