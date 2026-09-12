# TFLives Web — v0.5.0 Profiles & Identity
## Directiva de implementación para Codex / GPT-5.1 Terra High

**Repositorio:** `C:\Users\Administrator\Desktop\web-tflives`  
**Branch:** `main`  
**Release objetivo:** `v0.5.0 — Profiles & Identity`  
**Estrategia:** un solo pase grande, conservador, con auditoría inicial única  
**Stack obligatorio:** Next.js App Router + TypeScript + Prisma + Neon PostgreSQL + Better Auth + Vercel + next-intl  
**Idiomas:** Español / Inglés  
**Estado de partida:** v0.4 Accounts, Security & Permissions funcional y desplegable

---

# 1. Misión

Convertir el perfil de TFLives en la identidad pública real de cada miembro.

v0.5 debe hacer que un usuario tenga una identidad coherente y reutilizable en toda la plataforma:

- perfil público claro y moderno;
- username canónico;
- nombre visible;
- avatar;
- banner/cabecera cuando la infraestructura existente lo permita;
- bio;
- enlaces sociales;
- rol visible;
- estado/actividad únicamente cuando exista soporte real;
- privacidad respetada;
- acciones sociales existentes integradas;
- edición de perfil sencilla;
- identidad consistente en chat, mensajes, amigos y otras superficies comunitarias.

No construir economía, achievements, cosméticos premium ni un sistema de themes.

---

# 2. Principio principal

TFLives debe distinguir claramente:

## Cuenta
Datos privados y de seguridad:

- email;
- password;
- OAuth;
- sesiones;
- 2FA;
- security log.

## Perfil
Identidad pública/comunitaria:

- username;
- display name;
- avatar;
- bio;
- banner si aplica;
- enlaces;
- rol/badges básicos;
- fecha de ingreso;
- acciones sociales.

No mezclar información sensible de Account en el perfil público.

---

# 3. Antes de implementar: auditoría única

Inspeccionar una sola vez:

- `prisma/schema.prisma`
- modelo `User`
- modelo `Profile` si existe
- username/onboarding actual
- `/perfil/[usuario]`
- configuración actual
- componentes de avatar/nombre
- friends/social graph
- blocks
- DMs
- global chat
- mentions
- roles
- privacy preferences
- notification preferences
- APIs de perfil existentes
- upload/media/storage existente
- `User.image`
- OAuth profile images
- admin user management
- i18n
- tests

Buscar especialmente:

- `username`
- `displayName`
- `name`
- `image`
- `avatar`
- `banner`
- `bio`
- `social`
- `profile`
- `friend`
- `block`
- `privacy`
- `role`
- `lastSeen`
- `presence`

Después de la auditoría, implementar directamente.

No responder con un plan largo salvo bloqueo técnico real.

---

# 4. Reutilización obligatoria

Preservar:

- Better Auth;
- User/Session/Account existentes;
- username actual;
- social graph;
- friend requests;
- blocks;
- DMs;
- chat;
- moderation;
- roles USER/MOD/ADMIN;
- security settings v0.4;
- ES/EN;
- diseño actual.

No duplicar:

- usuarios;
- perfiles;
- relaciones;
- roles;
- avatars si ya existe un campo utilizable;
- privacy settings.

---

# 5. Alcance funcional de v0.5

Implementar/completar:

1. Perfil público renovado.
2. Edición de perfil.
3. Username/display name claramente separados.
4. Bio.
5. Avatar consistente.
6. Banner si existe infraestructura segura para imágenes.
7. Enlaces sociales controlados.
8. Rol público y badges básicos existentes.
9. Fecha de miembro.
10. Acciones Amigo / Mensaje / Bloquear ya existentes.
11. Integración con privacidad actual.
12. Identidad reutilizable en chat/DMs/friends.
13. Username management seguro.
14. Estados vacíos y fallbacks.
15. Mobile/responsive.
16. ES/EN.
17. Tests.
18. Migración Prisma solo si hace falta.
19. Build final.

---

# 6. Fuera de alcance

No implementar:

- TFL Coins;
- economía;
- marketplace;
- achievements completos;
- XP/niveles;
- cosmetics marketplace;
- marcos premium;
- themes premium;
- perfiles animados premium;
- suscripciones;
- creator/streamer ecosystem completo;
- analytics;
- feed social nuevo;
- comentarios públicos en perfil;
- posts;
- wall/timeline de usuario;
- WebSockets nuevos solo para presencia;
- almacenamiento de archivos nuevo salvo necesidad fuerte y mínima.

Estas áreas pertenecen a releases posteriores.

---

# 7. Perfil público

Ruta existente esperada:

`/[locale]/perfil/[usuario]`

Reutilizarla.

La página debe sentirse como una identidad de miembro, no como una ficha administrativa.

Composición recomendada:

- cabecera/banner;
- avatar;
- display name;
- `@username`;
- badge/rol visible;
- bio;
- enlaces públicos;
- fecha de miembro;
- acciones sociales;
- contenido secundario existente si aporta valor.

Evitar llenar la pantalla de métricas que todavía no existen.

---

# 8. Jerarquía visual

Prioridad:

1. Avatar.
2. Display name.
3. Username.
4. Rol/badge.
5. Bio.
6. Acciones.
7. Metadatos secundarios.

No dar a IDs internos, emails o información técnica presencia visual.

---

# 9. Username

El username es el identificador estable de comunidad.

Requisitos:

- único;
- case-insensitive para colisiones;
- normalizado;
- seguro para URLs;
- longitud razonable;
- charset definido;
- palabras reservadas protegidas;
- validación server-side;
- errores claros.

No confiar solo en el cliente.

Palabras reservadas sugeridas:

- admin
- administrator
- api
- auth
- login
- register
- configuracion
- settings
- profile
- perfil
- support
- staff
- tflives
- system

Ampliar según rutas reales del repo.

---

# 10. Cambio de username

Primero auditar si ya puede cambiarse.

Si ya existe soporte:

- reforzarlo;
- agregar cooldown razonable;
- impedir colisiones;
- registrar fecha del último cambio;
- preservar acceso a perfiles cuando sea razonable.

Si cambiar username requiere arquitectura desproporcionada:

- mantener username no editable en v0.5;
- no crear un sistema complejo de redirects solo por esta release;
- documentarlo.

No romper enlaces existentes por una implementación improvisada.

---

# 11. Display name

Permitir un nombre visible independiente del username si el modelo actual lo soporta o puede añadirse limpiamente.

Ejemplo:

- display name: `Jonathan`
- username: `@jonathan`

Reglas:

- longitud razonable;
- trimming;
- no HTML;
- no control characters;
- sanitización/escape normal de React;
- no impersonation protections exageradas en esta release.

Si no existe `displayName`, añadirlo de forma aditiva solo si mejora claramente la experiencia.

---

# 12. Bio

Añadir/evolucionar bio:

- opcional;
- corta;
- texto plano;
- límite razonable, por ejemplo 160–240 caracteres;
- contador de caracteres;
- multiline;
- no HTML;
- no Markdown complejo;
- links automáticos solo si ya existe una utilidad segura.

Server-side validation obligatoria.

---

# 13. Avatar

Auditar infraestructura actual.

Preferencias:

1. reutilizar avatar ya existente;
2. reutilizar `User.image`/imagen OAuth;
3. reutilizar upload/media existente si existe;
4. fallback determinista con iniciales.

No crear un proveedor de almacenamiento nuevo únicamente por avatar si el proyecto no tiene infraestructura de media.

Si ya existe upload seguro:

- permitir avatar custom;
- validar tipo;
- tamaño;
- dimensiones razonables;
- reemplazo;
- fallback.

No almacenar imágenes base64 grandes en PostgreSQL.

---

# 14. Banner

Banner es deseable, pero no debe forzar una nueva infraestructura.

Si ya existe media/upload:

- implementar banner;
- crop/cover visual;
- dimensiones responsivas;
- fallback visual TFLives.

Si NO existe media storage:

- usar un header visual/fallback generado por CSS;
- preparar el modelo/UI sin integrar un proveedor nuevo;
- documentar la limitación.

No introducir Vercel Blob/S3/Cloudinary solo porque sí.

---

# 15. Enlaces sociales

Permitir un conjunto pequeño y controlado.

Ejemplos:

- website;
- YouTube;
- Twitch;
- GitHub;
- X/Twitter;
- TikTok;
- Instagram.

No crear 30 plataformas.

Requisitos:

- URL válida;
- `https` preferido;
- límites;
- sanitización;
- `rel="noopener noreferrer"` cuando corresponda;
- no permitir `javascript:` u otros schemes peligrosos.

Si el schema actual ya tiene una estructura de links, reutilizarla.

---

# 16. Discord y Google vinculados

No exponer:

- email;
- provider account id;
- OAuth tokens.

En perfil público, como máximo puede mostrarse un indicador genérico de cuenta vinculada si tiene sentido.

No revelar identidad externa automáticamente.

La gestión real de proveedores sigue en:

`Configuración → Seguridad`.

---

# 17. Rol público

Mostrar roles existentes con moderación:

- USER: normalmente sin badge especial;
- MOD: badge discreto;
- ADMIN: badge discreto.

No introducir OWNER en v0.5.

No permitir que el usuario edite su rol.

---

# 18. Badges

v0.5 solo debe mostrar badges de identidad ya respaldados por datos reales.

Permitidos:

- staff role;
- badges oficiales existentes;
- eventualmente verified/official si ya existe concepto real.

No crear:

- achievement badges;
- premium badges;
- XP badges;
- purchasable badges.

Eso corresponde a v0.6/v0.8.

---

# 19. Fecha de miembro

Mostrar `Miembro desde ...` usando `createdAt` existente.

Usar formato localizado ES/EN.

No mostrar timestamps técnicos completos.

---

# 20. Estado / presencia

Auditar primero.

Si el proyecto ya mantiene actividad/presencia fiable:

- reutilizarla;
- respetar privacidad;
- mostrar estados simples.

Si no existe presencia real:

- no inventarla;
- no agregar WebSockets;
- no mostrar “Online” basándose únicamente en tener una sesión.

Puede omitirse en v0.5.

---

# 21. Privacidad

Reutilizar preferencias existentes.

El perfil debe respetar:

- bloqueos;
- visibilidad de lista de amigos;
- otras restricciones existentes.

No exponer información que Privacy oculta en otras áreas.

Si hace falta añadir una preferencia pequeña de perfil público/privado y encaja limpiamente, puede hacerse, pero no construir un ACL completo.

---

# 22. Perfil propio vs ajeno

## Perfil propio

Mostrar CTA:

`Editar perfil`

## Perfil ajeno

Reutilizar acciones existentes:

- Agregar amigo / solicitud pendiente / amigos;
- Mensaje;
- Bloquear / desbloquear;
- acciones MOD/ADMIN solo si ya existen.

No duplicar APIs sociales.

---

# 23. Usuarios bloqueados

Si A bloquea B:

- evitar acciones sociales improcedentes;
- respetar comportamiento actual del social graph;
- no filtrar información privada;
- perfil puede mostrarse de forma limitada según política existente.

No rediseñar todo el sistema de blocking.

---

# 24. Edición del perfil

Integrar dentro de Configuración.

Preferencia:

`Configuración → Perfil e identidad`

La navegación general podría quedar:

- Perfil e identidad
- Seguridad
- Privacidad
- Notificaciones

Reutilizar la arquitectura de tabs/secciones ya implementada en v0.4.

No crear una segunda aplicación de settings.

---

# 25. UX de edición

Debe permitir editar de forma clara:

- display name;
- username si está permitido;
- bio;
- avatar si hay soporte;
- banner si hay soporte;
- enlaces.

Requisitos:

- preview razonable;
- guardar explícitamente;
- disabled/loading;
- success feedback;
- error feedback;
- dirty state cuando sea útil;
- no guardar cada tecla automáticamente.

---

# 26. API

Preferir un endpoint coherente, por ejemplo:

`/api/account/profile`

o evolucionar el endpoint existente.

Server-side:

- obtener usuario desde sesión;
- ignorar userId del cliente;
- validar input;
- actualizar únicamente campos permitidos;
- evitar mass assignment;
- devolver DTO público/seguro.

---

# 27. DTO público de usuario

Crear/reutilizar una forma común de identidad pública.

Ejemplo conceptual:

```ts
type PublicIdentity = {
  id: string;
  username: string;
  displayName: string | null;
  image: string | null;
  role: PublicRole;
};
```

Agregar solo campos necesarios.

No pasar objetos `User` completos al cliente cuando solo se necesita identidad.

---

# 28. Componente reutilizable de identidad

Auditar duplicaciones en:

- global chat;
- DMs;
- friends;
- requests;
- profile;
- mentions.

Crear/evolucionar primitives compartidas si reduce duplicación:

- `UserAvatar`
- `UserIdentity`
- `UserIdentityCompact`

No hacer un refactor masivo de toda la app.

Cambiar únicamente superficies de comunidad relevantes y seguras.

---

# 29. Consistencia tras editar perfil

Después de cambiar nombre/avatar/bio:

- perfil debe actualizarse;
- chat nuevo debe usar identidad actual;
- DMs/friends deben reflejarla;
- no duplicar datos stale innecesariamente.

Si mensajes antiguos guardan snapshot por diseño, no migrarlos en masa.

---

# 30. Perfil inexistente

`/perfil/[usuario]` debe tener:

- 404/estado vacío coherente;
- ES/EN;
- CTA útil para volver a comunidad.

No mostrar error técnico Prisma.

---

# 31. Perfil suspendido/baneado

Si ya existe sanction/ban:

- preservar política actual;
- no revelar datos internos;
- evitar acciones incompatibles.

No construir un nuevo sistema de sanciones.

---

# 32. SEO básico

Perfil público:

- title con display name/username;
- description breve usando bio cuando sea apropiado;
- canonical route;
- no indexar perfiles privados si se introduce privacidad.

No dedicar la release a SEO avanzado; v0.13 existe para eso.

---

# 33. Seguridad

Todo update de perfil:

- requiere sesión;
- valida server-side;
- valida URLs;
- limita longitudes;
- no acepta HTML arbitrario;
- no acepta role;
- no acepta email;
- no acepta `emailVerified`;
- no acepta `twoFactorEnabled`;
- no acepta campos Better Auth sensibles.

---

# 34. Rate limits

Si existe rate-limit reutilizable de v0.4:

aplicarlo a cambios sensibles como username si tiene sentido.

No rate-limitar cada edición normal de bio de forma agresiva.

---

# 35. Prisma

Antes de modificar schema, reutilizar campos existentes.

Cambios posibles, solo si faltan:

- `displayName`
- `bio`
- `bannerUrl`
- `socialLinks`
- `usernameChangedAt`

No añadir todos por obligación.

Preferir el modelo existente.

Una sola migración aditiva para v0.5 si hace falta.

---

# 36. Migración

Si hay cambios Prisma:

- una migración;
- aditiva;
- defaults/nullables compatibles;
- sin reset;
- sin borrar datos;
- no aplicar automáticamente a Neon.

No usar:

- `prisma db push` en producción;
- `prisma migrate reset`.

---

# 37. Compatibilidad

No romper:

- usernames existentes;
- links de perfiles actuales;
- chats;
- DMs;
- friend graph;
- mentions;
- admin;
- OAuth;
- 2FA;
- security settings;
- sesiones.

---

# 38. Responsive

Validar:

- 390px;
- 768px;
- 1366px;
- 1920px.

Especialmente:

- banner;
- avatar;
- botones sociales;
- bio;
- links;
- settings form;
- nombre largo;
- username largo.

Nada debe desbordarse.

---

# 39. Accesibilidad

Todo lo nuevo:

- teclado;
- focus visible;
- labels;
- buttons reales;
- alt cuando corresponda;
- contraste;
- estados loading;
- feedback accesible;
- no depender solo de color.

---

# 40. i18n

Todo texto nuevo:

- `es`
- `en`

No hardcodear UI.

Fechas con locale correcto.

---

# 41. Diseño

Mantener identidad TFLives actual:

- dark premium;
- glass/blur cuando ya corresponda;
- azul;
- jerarquía limpia;
- tecnología/comunidad;
- sin sobrecargar.

No convertir perfiles en “gaming card” llena de neon, barras, XP y métricas que todavía no existen.

---

# 42. Empty states

Diseñar:

- sin bio;
- sin avatar;
- sin banner;
- sin links;
- sin amigos visibles;
- perfil inexistente;
- usuario bloqueado.

No dejar huecos rotos.

---

# 43. Tests mínimos

## Profile API

- no session → denied;
- own profile update → success;
- cannot update another user;
- mass assignment ignored/rejected;
- bio limits;
- invalid URLs rejected;
- username collision rejected;
- reserved username rejected.

## Public profile

- existing user;
- missing user;
- role representation;
- privacy respected.

## Social actions

- existing friend/block/message behavior not regressed.

## Username

Si editable:

- normalization;
- collision;
- case-insensitive uniqueness;
- cooldown if implemented.

## Settings

- load;
- update;
- server error state.

---

# 44. Validación final

Ejecutar scripts reales del repo:

```bash
npm run db:generate
npm run typecheck
npm test
npm run test:integration
npm run lint
npm run build
git diff --check
```

Si alguno no existe, no inventarlo.

Corregir errores causados por v0.5.

---

# 45. Criterios de aceptación

v0.5 está completa cuando:

1. Perfil público se siente terminado.
2. Username y display name están claros.
3. Bio funciona.
4. Avatar tiene fallback correcto.
5. Banner funciona solo si la infraestructura lo permite.
6. Enlaces sociales son seguros.
7. Roles se muestran correctamente.
8. Datos privados nunca aparecen.
9. Editar perfil está integrado en Configuración.
10. Cambios persisten.
11. Perfil propio y ajeno tienen acciones correctas.
12. Friends/DM/chat siguen funcionando.
13. Privacy/blocking no retrocede.
14. Identidad es consistente en superficies principales.
15. ES/EN está completo.
16. Mobile funciona.
17. Tests pasan.
18. Typecheck/lint/build pasan.
19. No se introdujo economía/XP/cosméticos.
20. No se aplicó migración a producción automáticamente.

---

# 46. Reglas de eficiencia para Codex

Optimizar consumo:

- leer este archivo completo una vez;
- auditar repo una vez;
- no entregar plan largo antes de implementar;
- no preguntar por decisiones ya resueltas;
- reutilizar componentes/APIs existentes;
- no investigar en web salvo API/version específica imprescindible;
- no reescribir auth;
- no tocar v0.4 salvo integración necesaria;
- no hacer refactors cosméticos masivos;
- una migración como máximo cuando sea razonable;
- agrupar i18n;
- agrupar tests;
- validar al final;
- solucionar tus propios errores;
- no explicar cada archivo durante ejecución.

Si una feature opcional requiere infraestructura grande —por ejemplo nuevo almacenamiento de imágenes—:
- no introducirla;
- usar fallback;
- documentarla.

---

# 47. Orden recomendado de implementación

1. Auditoría.
2. Modelo/DTO público.
3. API de perfil.
4. Edición en Configuración.
5. Perfil público.
6. Username/display name.
7. Avatar/banner según infraestructura.
8. Social links.
9. Acciones sociales.
10. Integración de identidad en chat/DM/friends.
11. Privacy/blocked states.
12. ES/EN.
13. Tests.
14. Build.
15. Reporte.

---

# 48. Git

No:

- commit;
- push;
- force push;
- rewrite history.

Dejar working tree listo para revisión.

---

# 49. Reporte final obligatorio

Responder de forma compacta con exactamente:

## Implemented
Resumen funcional.

## Reused / evolved
Sistemas existentes reutilizados.

## Profile model
Campos/modelos reales usados o añadidos.

## Public profile
Qué cambió.

## Profile editing
Qué se puede editar.

## Identity propagation
Dónde se reutiliza la identidad.

## Privacy / social
Integración con friends/blocks/privacy.

## Media
Avatar/banner y limitaciones reales.

## Database changes
Migración/campos.

## Validation performed
Comandos/resultados.

## Known limitations
Solo limitaciones reales.

## Manual steps required
Migración/env/storage si aplica.

## Files of special importance
Solo los principales.

No cerrar con un segundo resumen repetitivo.

---

# 50. Resultado esperado

Al finalizar v0.5, cada miembro de TFLives debe sentirse como una identidad real dentro de la comunidad.

El perfil debe ser:

- reconocible;
- editable;
- seguro;
- consistente;
- responsive;
- integrado con el resto de TFLives;
- preparado para que v0.6 agregue Progression & Achievements y v0.8 agregue Cosmetics & Premium sin rehacer su arquitectura.

La release debe construir la base de identidad, no adelantarse a las capas de progresión o monetización.
