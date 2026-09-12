# TFLives Web — v0.4.0 Accounts, Security & Permissions
## Directiva de implementación para GPT-5.1 Terra High / Codex

**Repositorio local:** `C:\Users\Administrator\Desktop\web-tflives`  
**Branch:** `main`  
**Release objetivo:** `v0.4.0 — Accounts, Security & Permissions`  
**Modelo recomendado:** GPT-5.1 Terra High  
**Estrategia:** un único pase grande, conservador y orientado a reutilización  
**Stack que debe preservarse:** Next.js App Router + TypeScript + Prisma + Neon PostgreSQL + Better Auth + Vercel + next-intl  
**Idiomas:** Español / Inglés  
**Estado de partida:** v0.3 Community & Realtime completada y funcional

---

# 1. Misión

Implementar de extremo a extremo la release **v0.4.0 — Accounts, Security & Permissions** sobre el repositorio existente de TFLives.

El objetivo es convertir el sistema actual de cuentas/autenticación en una base sólida de producción sin reescribir la arquitectura.

La release debe reforzar:

- autenticación;
- OAuth;
- account linking;
- verificación de email;
- recuperación y cambio de contraseña;
- gestión de sesiones;
- revocación de sesiones;
- seguridad de login;
- rate limiting;
- logs de seguridad;
- visibilidad de sesiones/dispositivos;
- 2FA si Better Auth lo soporta limpiamente;
- permisos/roles más sólidos;
- protección server-side;
- experiencia de cuenta clara y consistente.

No es un rewrite.

Antes de crear cualquier sistema nuevo:

1. audita lo existente;
2. reutiliza Better Auth y los modelos actuales;
3. extiende solo lo necesario;
4. evita duplicar auth, sessions, roles, permissions o security logs;
5. mantén compatibilidad con usuarios existentes.

---

# 2. Contexto actual obligatorio

El proyecto ya tiene:

- Next.js App Router;
- TypeScript;
- Prisma;
- Neon PostgreSQL;
- Better Auth;
- Vercel;
- ES/EN;
- email/password;
- Discord OAuth preparado/configurable;
- Google OAuth preparado/configurable;
- onboarding de username;
- perfiles;
- social graph;
- mensajes;
- notificaciones;
- moderación;
- admin;
- v0.2 Network/CMS/Wiki;
- v0.3 Community & Realtime.

Preserva todo.

No conviertas v0.4 en una reimplementación general de la plataforma.

---

# 3. Arquitectura no negociable

Mantener:

- Next.js App Router;
- TypeScript;
- Prisma;
- Neon PostgreSQL;
- Better Auth;
- Vercel;
- i18n actual;
- diseño/rebrand TFLives;
- usuarios existentes;
- roles existentes como punto de partida;
- sesiones existentes;
- social/messaging/admin actuales.

Prohibido:

- Supabase;
- Firebase;
- Clerk;
- Auth0;
- reemplazar Better Auth;
- reemplazar Prisma;
- reemplazar Neon;
- introducir una segunda base de datos de usuarios;
- duplicar sesiones o cuentas;
- crear un auth paralelo.

---

# 4. Auditoría inicial obligatoria

Antes de implementar, inspecciona como mínimo:

- `package.json`
- `prisma/schema.prisma`
- configuración Better Auth
- `src/app/api/auth/[...all]`
- auth client/helpers
- session helpers
- middleware
- login/register pages
- forgot/reset password
- onboarding
- configuración de cuenta
- perfil
- `/api/me`
- endpoints de usuario
- admin/users
- roles actuales
- guards administrativos
- email provider actual
- Resend/configuración email si existe
- variables `.env.example`
- tablas Better Auth generadas
- modelo `User`
- sesiones/accounts/verifications
- rate limiting existente
- audit/staff logs existentes
- notification system
- tests actuales
- i18n
- manejo de errores/toasts
- páginas de configuración

Buscar especialmente:

- `User`
- `Session`
- `Account`
- `Verification`
- `role`
- `ban`
- `emailVerified`
- `twoFactor`
- `security`
- `audit`
- `permission`
- `oauth`
- `socialProviders`
- `changePassword`
- `revokeSession`
- `listSessions`

Para cada feature:

- reutiliza si existe;
- extiende si está incompleta;
- reemplaza solo si está claramente rota;
- no crees modelos paralelos sin necesidad.

No te detengas tras la auditoría salvo bloqueo técnico real.

---

# 5. Alcance de v0.4

Implementar/completar:

1. Discord OAuth robusto.
2. Google OAuth robusto.
3. Account linking seguro.
4. Prevención de cuentas duplicadas.
5. Verificación de email.
6. Reenvío de verificación.
7. Recuperación de contraseña.
8. Cambio de contraseña.
9. Gestión de sesiones.
10. Revocar sesión individual.
11. Revocar todas las demás sesiones.
12. Vista de dispositivos/sesiones.
13. 2FA opcional si encaja limpiamente con Better Auth.
14. Protección brute-force.
15. Rate limits de auth.
16. Security log.
17. Alertas/notificaciones de seguridad razonables.
18. Revisión de permisos y roles.
19. Guards server-side consistentes.
20. UX de cuenta/seguridad.
21. ES/EN.
22. Tests.
23. Build.
24. Documentación mínima de rollout.

---

# 6. Fuera de alcance

No implementar en v0.4:

- TFL Coins;
- wallets;
- economía;
- cosméticos;
- suscripciones;
- marketplace;
- progression;
- achievements avanzados;
- streamer ecosystem;
- analytics avanzada;
- redesign global;
- passkeys/WebAuthn salvo que ya estén casi resueltos por Better Auth y no añadan complejidad;
- SSO empresarial;
- organización multi-tenant;
- sistema de invitaciones complejo;
- permisos por recurso extremadamente granulares;
- ACL por objeto;
- dashboard de seguridad empresarial.

---

# 7. OAuth — Discord

Mantener Better Auth como dueño del flujo.

Configurar/validar correctamente:

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- callback de Better Auth
- base URL canónica

Callback esperado en producción:

`https://www.tflives.com/api/auth/callback/discord`

Desarrollo:

`http://localhost:3000/api/auth/callback/discord`

Requisitos:

- no hardcodear secretos;
- usar variables existentes;
- manejar cancelación del usuario;
- manejar provider errors;
- evitar redirect loops;
- preservar locale al volver si es razonable;
- no crear una cuenta duplicada si ya existe una cuenta válida que debe vincularse.

---

# 8. OAuth — Google

Mismo enfoque que Discord.

Configurar/validar:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- callback Better Auth;
- dominio base correcto;
- errores/cancelación;
- account linking.

No inventar rutas OAuth personalizadas si Better Auth ya provee las correctas.

---

# 9. Account linking

Objetivo: una sola identidad TFLives con múltiples métodos de acceso.

Debe soportar, según capacidades actuales de Better Auth:

- email/password + Discord;
- email/password + Google;
- Discord + Google;
- múltiples providers vinculados a un mismo usuario.

Reglas:

- no vincular cuentas arbitrariamente solo porque el email coincida si eso sería inseguro;
- usar mecanismos de Better Auth;
- requerir sesión/autenticación reciente cuando corresponda;
- evitar takeover por provider;
- no permitir unlink del último método de acceso usable;
- confirmar acciones sensibles.

Si Better Auth ya maneja linking por configuración oficial, úsalo.

No construir linking manual con SQL salvo necesidad real.

---

# 10. Prevención de cuentas duplicadas

Resolver casos como:

- usuario registrado por email/password;
- después entra con Discord usando mismo email;
- después Google devuelve mismo email;
- provider no entrega email;
- email provider no verificado.

No fusionar silenciosamente identidades inseguras.

Priorizar:

- seguridad;
- mensajes claros;
- linking explícito cuando haga falta.

Documentar decisiones tomadas.

---

# 11. Verificación de email

Completar flujo de verificación.

Requisitos:

- envío de email de verificación;
- token seguro;
- expiración;
- link válido;
- estado claro de éxito/error;
- reenvío;
- rate limit de reenvío;
- no filtrar si un email existe cuando no sea necesario.

Usar Better Auth y proveedor email existente.

No construir un token system paralelo si Better Auth ya lo soporta.

---

# 12. Política de email verification

Default recomendado para esta release:

- permitir crear cuenta;
- pedir/verificar email;
- restringir acciones sensibles si el email no está verificado;
- no bloquear innecesariamente navegación pública.

Si la implementación actual ya tiene una política explícita, preservarla y mejorar UX.

No cambiar comportamiento crítico sin razón.

---

# 13. Recuperación de contraseña

Completar `forgot-password` y `reset-password`.

Debe incluir:

- solicitud por email;
- respuesta genérica para evitar enumeration;
- token seguro;
- expiración;
- invalidación tras uso;
- contraseña nueva;
- validación razonable;
- invalidar/revocar sesiones antiguas cuando sea apropiado.

No mostrar:

- “ese email no existe”;
- detalles internos.

---

# 14. Cambio de contraseña

Desde configuración de cuenta:

- requerir sesión;
- validar contraseña actual si Better Auth/estrategia lo permite;
- nueva contraseña;
- confirmación;
- feedback claro;
- opción de cerrar otras sesiones.

Para cuentas OAuth-only:

- mostrar comportamiento coherente;
- no presentar formulario inútil si no tienen password credential.

---

# 15. Política de contraseña

Evitar reglas absurdas.

Preferir:

- longitud mínima razonable;
- longitud máxima segura;
- permitir password managers;
- no obligar símbolos específicos;
- no truncar silenciosamente;
- no bloquear paste.

Si Better Auth ya define la política, no duplicarla en múltiples lugares.

Cliente y servidor deben coincidir.

---

# 16. Gestión de sesiones

Crear/mejorar una sección real de sesiones.

Mostrar:

- sesión actual;
- otras sesiones;
- fecha de creación;
- última actividad si está disponible;
- navegador/dispositivo aproximado si puede derivarse sin invadir privacidad;
- IP parcialmente enmascarada solo si ya se almacena y si es adecuado;
- current-session marker.

Acciones:

- cerrar sesión actual;
- revocar sesión individual;
- cerrar todas las demás sesiones.

No inventar datos de device que Better Auth no tenga.

---

# 17. Dispositivos / sesiones

No implementar fingerprinting invasivo.

Si user-agent existe:

- parseo ligero;
- “Chrome en Windows”;
- “Safari en iPhone”;
- etc.

No crear tracking persistente complejo.

No guardar hardware IDs.

---

# 18. 2FA

Implementar **solo si Better Auth lo soporta de forma oficial y limpia con las versiones instaladas**.

Preferencia:

- TOTP;
- QR;
- recovery codes;
- enable;
- verify;
- disable con reautenticación.

No añadir una librería pesada o arquitectura paralela si Better Auth actual no lo soporta bien.

Si 2FA no es viable sin upgrade riesgoso:

- no forzar;
- dejar integración preparada;
- documentar limitación.

2FA debe ser opcional en v0.4.

---

# 19. Recovery codes

Solo si 2FA se implementa.

Requisitos:

- generados server-side;
- mostrar una sola vez;
- almacenar hash, no plaintext;
- consumo único;
- regeneración invalida anteriores.

No loggear códigos.

---

# 20. Brute-force protection

Proteger:

- login;
- register;
- forgot password;
- reset;
- resend verification;
- 2FA verify;
- account linking sensible.

Usar rate limiting server-side.

No depender del frontend.

Estrategia:

- límites por IP cuando sea viable;
- límites por cuenta/email hasheado cuando sea apropiado;
- ventanas razonables;
- backoff;
- mensajes no reveladores.

Evitar bloqueo permanente por ataques externos.

---

# 21. Rate limiting

Reutilizar infraestructura existente si ya existe.

No introducir Redis solo por esta release salvo necesidad real.

Si el entorno actual no tiene almacenamiento distribuido de rate limits:

- usar una solución compatible con Vercel;
- o un enfoque conservador documentado;
- evitar rate limit en memoria como falsa seguridad de producción si se presenta como robusto.

No añadir proveedor externo si puede evitarse.

---

# 22. Security log

Crear/evolucionar un log de seguridad por usuario.

Eventos útiles:

- login success;
- login failed relevante;
- password changed;
- password reset;
- email verified;
- verification resent;
- OAuth linked;
- OAuth unlinked;
- session revoked;
- all sessions revoked;
- 2FA enabled;
- 2FA disabled;
- recovery codes regenerated;
- suspicious/rate-limited auth attempt.

No guardar:

- passwords;
- tokens;
- client secrets;
- raw recovery codes.

Campos razonables:

- id;
- userId nullable cuando aplique;
- event type;
- createdAt;
- IP masked/hashed opcional;
- userAgent resumido;
- metadata segura JSON.

---

# 23. UX del security log

Desde configuración:

- lista de actividad reciente;
- fecha;
- evento;
- dispositivo aproximado;
- estado.

No mostrar datos técnicos innecesarios al usuario.

Admin no necesita un SIEM completo en esta release.

---

# 24. Notificaciones de seguridad

Reutilizar notification system existente.

Notificar razonablemente:

- password changed;
- password reset completed;
- new OAuth provider linked;
- 2FA enabled/disabled;
- all sessions revoked;
- quizá login nuevo si puede detectarse de forma fiable.

No spamear por cada refresh/session check.

---

# 25. Roles

Auditar roles actuales.

Objetivo de esta release:

- hacerlos consistentes;
- evitar checks ad-hoc;
- centralizar helpers;
- preservar compatibilidad.

Base esperada aproximada:

- USER
- STREAMER si ya existe/necesario
- CLIENT si ya existe/necesario
- MOD
- ADMIN
- OWNER si ya existe o puede introducirse sin romper compatibilidad

No inventar roles que no tengan uso real.

---

# 26. RBAC evolutivo

No construir un sistema empresarial de permisos.

Sí hacer:

- helpers centralizados;
- jerarquía clara;
- checks server-side;
- evitar `role === "ADMIN"` disperso si hay helper mejor;
- mantener comportamiento actual.

Ejemplos:

- `canAccessAdminPanel`
- `canManageUsers`
- `canModerate`
- `canManageContent`
- `canManageSecurity`
- `isOwner`

Solo introducir una tabla Permission/RolePermission si la arquitectura realmente lo justifica.

Preferir primero helpers tipados y centralizados.

---

# 27. OWNER

Si se introduce `OWNER`:

- migración segura;
- no autoelevar usuarios;
- no degradar admins existentes;
- acciones críticas solo OWNER cuando tenga sentido;
- documentar cómo promover manualmente.

No asumir que todo ADMIN debe convertirse en OWNER.

Si OWNER ya existe, reutilizar.

---

# 28. Guards server-side

Toda acción sensible debe validar en servidor:

- sesión;
- identidad;
- rol;
- ownership;
- email verification si aplica;
- reauthentication si aplica.

No confiar en:

- UI oculta;
- route links;
- client-side role;
- userId enviado por cliente.

Revisar APIs existentes de admin/users/auth.

---

# 29. Middleware

Mantener middleware liviano.

No importar innecesariamente APIs Node incompatibles con Edge.

Si Better Auth/JOSE genera warnings de Edge conocidos:

- no empeorar la situación;
- mantener autorización real server-side;
- no mover lógica sensible al middleware si no hace falta.

---

# 30. Reautenticación

Para acciones sensibles:

- cambio de contraseña;
- unlink provider;
- disable 2FA;
- quizá revocar todas las sesiones.

Usar mecanismos oficiales disponibles.

No implementar reauth falsa solo con confirm modal.

---

# 31. CSRF / cookies / sesión

Auditar configuración Better Auth:

- cookie secure en producción;
- sameSite;
- httpOnly;
- trusted origins;
- base URL;
- callback URLs;
- session expiration.

No romper previews de Vercel sin necesidad.

No debilitar cookies para “hacer funcionar OAuth”.

---

# 32. Trusted origins

Configurar de forma explícita y segura.

Permitir:

- `https://www.tflives.com`
- localhost en desarrollo

No usar wildcard amplio salvo que la arquitectura actual lo requiera y esté justificado.

---

# 33. Variables de entorno

Revisar `.env.example`.

Debe contener solo placeholders.

Nunca valores reales.

Posibles variables existentes:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `AUTH_REQUIRE_EMAIL_VERIFICATION`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `RESEND_API_KEY`
- email sender/config related vars

No inventar variables duplicadas si Better Auth ya usa otras.

---

# 34. UI de Configuración / Seguridad

Evolucionar `/configuracion` o equivalente.

Secciones recomendadas:

- Cuenta
- Seguridad
- Métodos de acceso
- Sesiones
- Actividad de seguridad
- Notificaciones
- Privacidad existente

No crear una app separada.

---

# 35. Métodos de acceso

Mostrar de forma clara:

- Email/password: connected / unavailable
- Discord: linked / not linked
- Google: linked / not linked
- 2FA: enabled / disabled si aplica

Acciones:

- link;
- unlink;
- configure.

Prevenir unlink del último método viable.

---

# 36. Manejo de errores OAuth

UX clara para:

- invalid redirect;
- provider denied;
- provider email unavailable;
- account exists;
- linking required;
- session expired;
- provider already linked.

No mostrar stack traces.

Usar ES/EN.

---

# 37. Email UX

Plantillas de email mínimas pero coherentes con TFLives:

- verify email;
- reset password;
- security alert cuando aplique.

Reutilizar infraestructura email.

No convertir esta release en un proyecto de email marketing.

---

# 38. Datos / Prisma

Antes de añadir modelos:

- inspeccionar schema actual;
- identificar tablas Better Auth;
- no modificar tablas internas de Better Auth sin necesidad.

Posibles modelos propios si no hay equivalentes:

- `SecurityEvent`
- quizá `UserSecurityPreference`

No crear:

- UserSession paralelo si Better Auth ya tiene Session;
- OAuthAccount paralelo si Better Auth ya tiene Account.

---

# 39. Migraciones

Toda migración debe ser:

- aditiva;
- compatible con datos existentes;
- sin reset;
- sin seed productivo;
- con índices razonables;
- reversible conceptualmente.

No aplicar a Neon automáticamente.

No usar:

- `prisma db push` en producción;
- `prisma migrate reset`;
- DROP destructivo innecesario.

Generar deployment notes.

---

# 40. Compatibilidad con usuarios existentes

No romper:

- passwords actuales;
- sesiones actuales salvo necesidad documentada;
- OAuth ya vinculado;
- usernames;
- perfiles;
- roles;
- mensajes;
- admin access.

Si una sesión vieja debe invalidarse por seguridad, documentarlo.

---

# 41. Privacidad

No almacenar más información de la necesaria.

No mostrar:

- IP completa públicamente;
- tokens;
- provider secrets;
- internal IDs sin motivo;
- recovery codes después de su pantalla inicial.

Security log debe ser privado.

---

# 42. Seguridad de endpoints

Revisar especialmente:

- `/api/auth/*`
- `/api/me`
- `/api/admin/users`
- endpoints de role updates
- password routes
- session routes
- OAuth linking routes

Buscar:

- IDOR;
- privilege escalation;
- role spoofing;
- mass assignment;
- enumeration;
- missing rate limit;
- missing session validation.

---

# 43. Cambio de roles desde Admin

Si ya existe:

- mantenerlo;
- reforzar guards;
- no permitir que un admin se autoeleve a OWNER si no corresponde;
- proteger al último OWNER si se introduce ese concepto;
- registrar cambios de rol en staff/security log.

No crear burocracia innecesaria.

---

# 44. Logging

Logs de servidor:

- claros;
- sin secretos;
- sin password;
- sin OAuth tokens;
- sin reset tokens;
- sin full session cookie.

Errores auth deben ser diagnosticables sin filtrar información sensible.

---

# 45. Performance

No hacer queries excesivas en cada request.

Evitar:

- cargar security log en navbar;
- consultar todas las sesiones en cada page load;
- parseos pesados de user agent repetidos.

Cargar seguridad bajo demanda.

---

# 46. Accesibilidad

Todo lo nuevo debe soportar:

- keyboard;
- focus visible;
- labels;
- status messages;
- dialogs accesibles;
- errores asociados al input;
- loading state;
- no depender solo de color.

---

# 47. Responsive

Validar:

- login;
- register;
- forgot/reset;
- security settings;
- session list;
- provider linking;
- 2FA setup si existe;
- recovery codes.

Debe funcionar en 390px de ancho.

---

# 48. i18n

Todo texto nuevo:

- `es`
- `en`

No hardcodear mensajes UI.

Errores propios deben traducirse.

Mensajes internos de Better Auth pueden mapearse a textos amigables cuando sea razonable.

---

# 49. Tests mínimos

Usar framework existente.

## Auth

- register;
- login;
- logout;
- invalid credentials;
- rate limit;
- verified/unverified behavior.

## OAuth

- provider config/helpers;
- account linking logic;
- duplicate account prevention;
- unlink protection.

No intentar hacer OAuth real contra Discord/Google en tests si requiere internet/credentials.

Mock donde corresponda.

## Password

- forgot generic response;
- reset token behavior;
- change password;
- invalid password;
- revoke sessions after sensitive change si aplica.

## Sessions

- list own sessions;
- cannot view another user's sessions;
- revoke own secondary session;
- cannot revoke arbitrary foreign session;
- revoke others.

## Permissions

- USER denied admin;
- MOD allowed moderation;
- ADMIN allowed expected admin actions;
- OWNER protections si aplica.

## Security log

- sensitive actions create events;
- secrets not persisted.

## 2FA

Si se implementa:
- enable;
- verify;
- disable;
- recovery code.

---

# 50. Validación

Usar scripts reales del repo.

Intentar:

```bash
npm install
npm run db:generate
npm run typecheck
npm run lint
npm test
npm run build
npm run test:integration
git diff --check
```

Si alguno falla por un problema preexistente:

- distinguirlo claramente;
- no ocultarlo;
- arreglar solo si es razonable y relacionado.

No hacer push.

---

# 51. Criterios de aceptación

v0.4 se considera completa solo si:

1. Email/password sigue funcionando.
2. Discord OAuth está correctamente integrado.
3. Google OAuth está correctamente integrado.
4. Linking es seguro.
5. No se crean duplicados de cuenta de forma insegura.
6. Email verification funciona.
7. Reenvío de verificación funciona y está limitado.
8. Forgot/reset password funciona.
9. Change password funciona.
10. Sesiones pueden visualizarse.
11. Una sesión puede revocarse.
12. Pueden revocarse otras sesiones.
13. Device/session UX es razonable.
14. Brute-force/rate limits existen.
15. Security log existe o fue evolucionado.
16. Acciones de seguridad relevantes se registran.
17. Roles/guards están centralizados o mejorados.
18. Privilege escalation está bloqueado.
19. 2FA está implementado si es viable de forma limpia; si no, queda documentado sin hacks.
20. ES/EN cubre UI nueva.
21. Mobile funciona.
22. Build pasa.
23. Tests críticos pasan.
24. No Supabase/Firebase.
25. Better Auth sigue siendo la única capa de auth.
26. No se aplicaron migraciones a producción automáticamente.
27. No se hizo push automático.

---

# 52. Prohibiciones

No:

- Supabase;
- Firebase;
- Clerk;
- Auth0;
- reemplazar Better Auth;
- crear auth paralelo;
- crear Session paralela;
- crear Account OAuth paralela;
- guardar passwords;
- guardar OAuth tokens en logs;
- guardar reset tokens en logs;
- guardar recovery codes en plaintext;
- confiar en role del cliente;
- hardcodear secrets;
- meter secretos en `.env.example`;
- usar wildcard origins sin razón;
- desactivar seguridad de cookies para “arreglar” OAuth;
- introducir Redis solo porque sí;
- hacer `db push` productivo;
- hacer `migrate reset`;
- aplicar migraciones a Neon;
- commit automático;
- push;
- force push;
- refactor masivo fuera de scope.

---

# 53. Reglas de eficiencia para GPT-5.1 Terra High

Esta directiva está diseñada para minimizar consumo y evitar iteraciones innecesarias.

- Lee este documento completo una sola vez.
- Audita el repo una sola vez antes de cambiar código.
- No devuelvas un plan largo antes de implementar.
- No preguntes por decisiones ya resueltas aquí.
- No hagas búsquedas externas salvo que sean necesarias para una API concreta.
- Usa la versión instalada de Better Auth como source of truth.
- Reutiliza APIs oficiales de Better Auth.
- No inventes capas.
- No reescribas módulos estables.
- Agrupa cambios Prisma en una sola migración cuando sea razonable.
- Agrupa cambios i18n.
- Agrupa validación al final.
- Corrige errores causados por tus cambios.
- No gastes contexto describiendo cada archivo mientras trabajas.
- No produzcas documentación extensa adicional salvo deployment/migration/security notes.
- Si una feature opcional como 2FA requiere un upgrade riesgoso, no fuerces la implementación.
- Toma decisiones conservadoras.
- Prioriza código funcional sobre refactors estéticos.

---

# 54. Orden de ejecución recomendado

1. Auditar auth/schema/config.
2. Mapear funciones Better Auth instaladas.
3. Definir mínimos cambios de datos.
4. Implementar OAuth/linking.
5. Email verification.
6. Password recovery/change.
7. Sessions.
8. Security log.
9. Rate limiting.
10. Roles/guards.
11. 2FA solo si encaja limpiamente.
12. UI configuración.
13. ES/EN.
14. Tests.
15. Build.
16. Migration/deployment notes.
17. Reporte final.

No detenerse entre etapas salvo error real.

---

# 55. Git

Repositorio:

`C:\Users\Administrator\Desktop\web-tflives`

Branch:

`main`

No:

- commit;
- push;
- force push;
- rewrite history.

Dejar working tree listo para revisión.

---

# 56. Reporte final obligatorio

Responder de forma compacta con exactamente estas secciones:

## Implemented
Resumen funcional.

## Reused / evolved
Qué sistemas existentes se reutilizaron.

## Better Auth changes
Configuración/features usadas.

## Database changes
Modelos/campos/migración.

## OAuth / account linking
Discord, Google y linking.

## Password / email verification
Estado de flows.

## Sessions / security
Sesiones, revoke, logs, rate limits.

## Roles / permissions
Cambios reales.

## 2FA
Implementado o razón concreta para no implementarlo.

## Environment variables
Solo nombres. Nunca valores.

## Validation performed
Comandos y resultados.

## Known limitations
Solo reales.

## Manual steps required
OAuth console, env, migration, etc.

## Files of special importance
Solo los más relevantes.

No terminar con “done” ni con un resumen repetido.

---

# 57. Manual deployment expectations

No aplicar producción automáticamente.

Si hay migración:

- dejar SQL generado;
- documentar orden correcto;
- indicar `prisma migrate status`;
- usar `prisma migrate deploy` solo como paso manual posterior a revisión;
- nunca `db push`.

Si Discord/Google requieren configuración externa:

documentar exactamente los redirect URIs esperados.

Producción canónica:

`https://www.tflives.com`

Better Auth callback pattern:

`https://www.tflives.com/api/auth/callback/<provider>`

---

# 58. Resultado esperado

Al finalizar v0.4, TFLives debe tener una capa de cuentas que pueda crecer hacia producción:

- login confiable;
- OAuth usable;
- una sola identidad por usuario;
- linking seguro;
- verificación de email;
- recuperación de acceso;
- control de sesiones;
- acciones sensibles protegidas;
- actividad de seguridad visible;
- roles consistentes;
- server-side authorization sólida;
- experiencia clara en desktop/mobile.

La release debe mejorar seguridad sin volver el producto incómodo ni sobre-ingenierizado.
