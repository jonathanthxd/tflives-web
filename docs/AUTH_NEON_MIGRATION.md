# Migración TFLives: Neon + Better Auth

La aplicación ya no depende de Supabase. PostgreSQL vive en Neon y la autenticación
la gestiona Better Auth con Prisma como adaptador.

## Qué cambió

- Email/contraseña, sesión, cierre de sesión y OAuth pasan a Better Auth.
- Google y Discord OAuth son opcionales y se configuran por variables de entorno.
- Recuperación y verificación de correo usan el callback de email de Better Auth.
- Avatares y banners se guardan temporalmente en PostgreSQL mediante `ProfileAsset`.
- Mensajes y notificaciones ya no necesitan un servicio de realtime externo: usan
  polling sobre las APIs de Next.js. La capa se puede sustituir por WebSocket/SSE más adelante.

## Base de datos nueva o vacía

1. Copia `.env.example` a `.env` y configura `DATABASE_URL` con Neon.
2. Ejecuta `npm install`.
3. Ejecuta `npm run db:generate`.
4. Revisa que `DATABASE_URL` apunta al proyecto/branch correcto de Neon.
5. Ejecuta `npm run db:push` para crear/sincronizar el esquema.
6. Arranca con `npm run dev`.

## Si Neon ya contiene usuarios de la etapa anterior

Better Auth necesita `User.name` no nulo y nuevas tablas `Session`, `Account` y
`Verification`. Antes de aplicar el esquema, haz un backup/branch de Neon.

Si existen filas antiguas con `name IS NULL`, normalízalas primero (ajusta el SQL
si tus nombres físicos de tabla/columnas fueron modificados):

```sql
UPDATE "User"
SET "name" = COALESCE(
  NULLIF("display_name", ''),
  NULLIF("username", ''),
  NULLIF(split_part("email", '@', 1), ''),
  'Usuario'
)
WHERE "name" IS NULL;
```

Después puedes ejecutar `npm run db:push`.

### Credenciales antiguas

Las contraseñas administradas por el proveedor de autenticación anterior no están
en la tabla `User` de Neon. Una fila antigua de `User` no contiene por sí sola una
credencial que Better Auth pueda verificar.

- Si solo era data de desarrollo, lo más limpio es usar una base/branch de Neon nuevo.
- Si hay usuarios reales que deban conservarse, no borres sus filas: prepara una
  migración de cuentas/credenciales o un flujo de recuperación antes de abrir login.

## OAuth local

Configura estas URLs en los proveedores:

- Google: `http://localhost:3000/api/auth/callback/google`
- Discord: `http://localhost:3000/api/auth/callback/discord`

Y completa `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DISCORD_CLIENT_ID` y
`DISCORD_CLIENT_SECRET` según corresponda.

## Email en desarrollo

Con `AUTH_REQUIRE_EMAIL_VERIFICATION=false`, el registro puede probarse sin servicio
de correo. Si solicitas recuperación de contraseña sin `RESEND_API_KEY`, el enlace
se imprime en el terminal de desarrollo. En producción configura un proveedor de
correo y activa la verificación cuando corresponda.
