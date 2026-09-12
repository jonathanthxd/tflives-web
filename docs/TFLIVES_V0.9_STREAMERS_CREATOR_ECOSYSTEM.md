# TFLives Web — v0.9.0 Streamers & Creator Ecosystem
## Directiva compacta para Codex — GPT-5.6 Terra Extra High (Standard)

**Repositorio:** `C:\Users\Administrator\Desktop\web-tflives`  
**Branch:** `main`  
**Release:** `v0.9.0 — Streamers & Creator Ecosystem`  
**Prioridad:** convertir la sección de Streamers en un ecosistema real de creadores, integrado a perfiles y administrable  
**Estado base:** v0.8 Cosmetics & Premium funcional + perfiles sociales + progresión + economía  
**Stack obligatorio:** Next.js App Router + TypeScript + Prisma + Neon PostgreSQL + Better Auth + Vercel + next-intl

---

# 1. Objetivo

Construir el ecosistema de creadores de TFLives.

v0.9 debe convertir la actual sección de Streamers en una experiencia real donde:

- un usuario de TFLives pueda tener perfil de creador;
- un creador pueda mostrar sus plataformas;
- TFLives pueda destacar/promocionar creadores;
- exista un proceso de solicitud/aprobación;
- haya categorías/estado;
- los perfiles públicos integren el rol de creador;
- Admin pueda gestionar el programa;
- el sistema quede preparado para futuras integraciones con APIs externas sin depender de ellas en v0.9.

La release debe sentirse como una expansión social de TFLives, no como otra plataforma de streaming.

---

# 2. Regla de eficiencia

Haz UNA auditoría dirigida únicamente de:

- perfiles/identidad pública;
- follows/friends/likes;
- roles/permisos;
- admin patterns;
- editorial/content patterns;
- notifications;
- Prisma User/Profile;
- rutas actuales `/streamers`;
- tests relevantes.

Después implementa directamente.

NO:
- auditoría global;
- plan largo previo;
- refactors generales;
- investigación web salvo API instalada imprescindible;
- integraciones complejas con Twitch/YouTube/Kick en esta release.

---

# 3. Principio de producto

TFLives debe ser el hub de identidad del creador.

El creador sigue publicando en:
- Twitch;
- YouTube;
- Kick;
- TikTok;
- otras plataformas compatibles;

pero TFLives centraliza:

- su identidad;
- enlaces;
- categoría;
- estado;
- descripción;
- contenido destacado;
- visibilidad en la comunidad;
- pertenencia al programa de creadores.

---

# 4. Alcance obligatorio

Implementar:

1. perfil de creador asociado a un usuario real;
2. solicitud para entrar al programa;
3. aprobación/rechazo desde Admin;
4. estado del creador;
5. plataformas/enlaces;
6. categorías;
7. creator card pública;
8. página pública de creadores;
9. página individual de creador;
10. integración con perfil normal;
11. featured creators;
12. notificaciones;
13. admin management;
14. ES/EN;
15. migración Prisma aditiva;
16. tests críticos;
17. build final.

---

# 5. Fuera de alcance

NO implementar:

- OAuth de Twitch/YouTube/Kick;
- lectura automática de viewers;
- live status vía APIs externas;
- chat de Twitch/YouTube;
- monetización;
- payouts;
- revenue share;
- sponsorship marketplace;
- donaciones;
- subs;
- embeds pesados;
- analytics avanzados;
- creator economy;
- creator contracts;
- OBS integration;
- stream key management;
- clips ingestion automático;
- moderation de streams;
- Discord bot features nuevas.

---

# 6. Modelo de Creator

Un CreatorProfile debe depender de un User existente.

Concepto:

```text
CreatorProfile
- id
- userId
- slug
- status
- category
- headline
- description
- featured
- acceptedAt
- createdAt
- updatedAt
```

Nunca crear creadores “fantasma” sin cuenta de TFLives.

---

# 7. Estados

Mantener pocos estados:

```text
PENDING
ACTIVE
PAUSED
REJECTED
```

Opcional:

```text
INACTIVE
```

si encaja mejor con el modelo existente.

El estado debe controlar visibilidad pública.

---

# 8. Categorías

Mantener pocas categorías iniciales.

Ejemplo:

- Minecraft
- Fortnite
- Roblox
- Variety
- Just Chatting
- Otros

No crear taxonomía compleja.

Admin puede elegir categoría al aprobar/editar.

---

# 9. Plataformas

Soportar inicialmente:

- Twitch
- YouTube
- Kick
- TikTok
- Facebook Gaming
- X / Twitter opcional
- enlace externo genérico opcional

Usar URLs validadas.

No permitir:
- javascript URLs;
- HTML;
- embeds arbitrarios.

---

# 10. Solicitud de creador

Usuario autenticado puede solicitar entrar al programa.

Formulario mínimo:

- plataforma principal;
- URL;
- categoría principal;
- descripción breve;
- motivación;
- frecuencia/actividad aproximada opcional.

No pedir 20 campos.

Debe existir una sola solicitud activa por usuario.

---

# 11. UX de solicitud

Estados:

```text
No aplicado
Pendiente
Aceptado
Rechazado
Pausado
```

Mostrar claramente al usuario.

Si fue rechazado:
- mensaje neutral;
- posibilidad de reaplicar solo si Admin habilita/reabre o después de condición simple definida.

No crear sistema de apelaciones complejo.

---

# 12. Admin — Solicitudes

Crear sección admin:

```text
Admin
→ Creadores
   → Solicitudes
   → Activos
   → Pausados
```

Admin puede:

- revisar solicitud;
- abrir perfil de usuario;
- ver plataformas;
- aprobar;
- rechazar;
- pausar;
- reactivar;
- destacar;
- editar categoría;
- editar headline/descripción si corresponde.

Toda acción sensible debe quedar en audit log.

---

# 13. Página pública `/streamers`

Rehacer/fortalecer la ruta actual.

Debe mostrar:

- hero pequeño;
- creadores destacados;
- todos los creadores activos;
- filtros por categoría;
- búsqueda por nombre/@;
- CTA para solicitar entrada al programa;
- empty state elegante.

No convertirlo en una página gigantesca.

---

# 14. Creator cards

Cada card debe usar datos reales de User:

- avatar;
- display name;
- @username;
- creator badge;
- categoría;
- headline corta;
- plataformas;
- indicador featured.

Click:
- abre página individual del creador.

Evitar duplicar nombre/avatar en CreatorProfile.

Siempre leer identidad principal desde User/Profile.

---

# 15. Página individual del creador

Ruta recomendada:

```text
/[locale]/streamers/[username]
```

o slug equivalente seguro.

Debe mostrar:

- avatar;
- nombre;
- @;
- badge de creador;
- bio/headline;
- categoría;
- plataformas;
- link al perfil completo de TFLives;
- follow/profile like existentes si encaja sin duplicar lógica;
- contenido destacado manual opcional si es barato.

No rehacer el perfil normal dentro de esta página.

---

# 16. Integración con perfil normal

En `/perfil/[usuario]`, si el usuario es creator ACTIVE:

mostrar:
- badge “Creador”;
- categoría;
- CTA “Ver perfil de creador”.

No romper layout del perfil.

No mostrar herramientas de creator en perfiles de no-creadores.

---

# 17. Featured creators

Admin puede marcar creators como featured.

La home de Streamers prioriza featured.

Reglas:

- máximo visual recomendado: 3–6;
- no requiere ordenamiento complejo;
- puede usar `featured` + `featuredOrder` opcional.

Si se implementa order:
- entero simple;
- fallback por fecha/nombre.

---

# 18. Contenido destacado manual

Opcional pero recomendado si es barato:

CreatorProfile puede tener:
- `featuredTitle`;
- `featuredUrl`;
- `featuredPlatform`.

Solo URL segura.

No hacer scraping/preview avanzado.

No iframe arbitrario.

Si el provider ya permite embed seguro y controlado, se puede usar solo para YouTube/Twitch mediante allowlist; si implica mucho trabajo, usar link card.

---

# 19. Badge Creator

Añadir badge visual oficial para creators ACTIVE.

Debe coexistir con:
- roles;
- Premium;
- profile badges cosméticos.

No confundir Creator con Staff.

No otorgar permisos administrativos.

---

# 20. Seguimiento social

No crear un segundo sistema de followers.

Reutilizar el sistema actual de follows.

Desde creator page se puede:
- seguir al usuario;
- dar like al perfil;
- ver contadores existentes.

No crear `CreatorFollower`.

---

# 21. Notificaciones

Reutilizar notifications.

Notificar:

- solicitud enviada;
- solicitud aprobada;
- solicitud rechazada;
- creator pausado/reactivado;
- destacado opcionalmente.

Evitar spam.

---

# 22. Privacidad

Creator ACTIVE es público.

Solicitud:
- privada entre usuario y Admin.

No exponer:
- motivación interna;
- notas admin;
- logs;
- rejection notes internas;
- emails.

---

# 23. Admin notes

Permitir nota interna opcional en solicitud.

No mostrarla al usuario.

Si existe razón visible de rechazo:
- campo separado;
- sanitizado;
- breve.

---

# 24. Prisma

Cambios razonables:

```text
CreatorProfile
CreatorApplication
CreatorPlatform
```

Enums:
- CreatorStatus
- CreatorCategory
- CreatorPlatformType
- CreatorApplicationStatus

No crear más tablas si no hacen falta.

Una sola migración v0.9.

Debe ser:
- aditiva;
- indexada;
- no destructiva;
- compatible con datos actuales.

No aplicar a Neon automáticamente.

---

# 25. Relaciones

Reglas:

- 1 User → 0/1 CreatorProfile
- 1 User → aplicaciones históricas o una activa según diseño
- CreatorProfile → múltiples platforms

Usar constraints para evitar duplicados.

---

# 26. Seguridad

Todas las mutaciones:

- sesión requerida;
- server-side auth;
- role check para Admin;
- ownership check;
- URL validation;
- status transition validation.

No confiar en IDs/role enviados por cliente.

---

# 27. Slugs / usernames

Preferir username como URL si ya es estable con aliases.

Si se usa creator slug:
- único;
- normalizado;
- server-generated/validated.

No crear problemas con username aliases existentes.

---

# 28. i18n

Todo nuevo:
- ES;
- EN.

No hardcodear:
- categorías;
- estados;
- plataformas;
- CTA;
- mensajes de solicitud.

---

# 29. Responsive

Validar:

- 390px;
- 768px;
- 1366px;
- 1920px.

Especialmente:
- creator cards;
- filtros;
- solicitud;
- admin;
- creator page.

---

# 30. Accesibilidad

- botones reales;
- focus visible;
- cards navegables correctamente;
- links con label;
- iconos con aria cuando corresponda;
- categoría no comunicada solo por color.

---

# 31. Performance

- paginar/listar de forma razonable;
- no N+1 en creator cards;
- traer User identity junto al CreatorProfile;
- no cargar información privada;
- evitar APIs externas.

---

# 32. SEO

Creator pages públicas deben tener metadata básica:

- title;
- description;
- avatar/og image si existe;
- canonical interno.

No dedicar la release a SEO avanzado.

---

# 33. Tests críticos

## Application
- authenticated user can apply;
- duplicate active application denied;
- invalid URL rejected.

## Admin
- USER/MOD cannot approve;
- ADMIN can approve/reject/pause/reactivate;
- actions audit logged.

## Creator profile
- only ACTIVE is publicly listed;
- PENDING/REJECTED not public;
- user identity comes from User/Profile.

## Platforms
- safe URL validation;
- duplicate provider handling if applicable.

## Social integration
- existing follow/like still works.

## Security
- cannot mutate another creator profile;
- internal application/admin fields not exposed publicly.

---

# 34. Compatibilidad

No romper:

- auth/OAuth/2FA;
- profiles;
- followers/likes;
- profile rework;
- chat;
- DMs;
- friends;
- Team;
- progression;
- achievements;
- TFL Coins;
- cosmetics;
- Premium;
- notifications;
- admin existing sections.

---

# 35. Criterios de aceptación

v0.9 está completa cuando:

1. usuario puede solicitar ser creator;
2. Admin puede aprobar/rechazar;
3. creator ACTIVE aparece públicamente;
4. creator card usa identidad real del User;
5. `/streamers` permite descubrir creators;
6. creator page funciona;
7. perfil normal muestra creator badge/CTA;
8. featured funciona;
9. plataformas son seguras;
10. no existe creator follower duplicado;
11. notificaciones funcionan;
12. permisos son correctos;
13. ES/EN completo;
14. mobile funciona;
15. tests pasan;
16. typecheck/lint/build pasan;
17. migración queda generada y NO aplicada;
18. no se añadieron integraciones externas complejas.

---

# 36. Validación final

Ejecutar una sola vez:

```bash
npm run db:generate
npm run typecheck
npm test
npm run test:integration
npm run lint
npm run build
git diff --check
```

Corregir solo problemas causados por esta release.

---

# 37. Git

No:
- commit;
- push;
- force push.

---

# 38. Reporte final

Responder solo con:

## Implemented
## Creator model
## Applications
## Public discovery
## Creator profile
## Profile integration
## Admin controls
## Notifications
## Security
## Database changes
## Validation performed
## Known limitations
## Manual steps required
## Files of special importance

Máximo pocas líneas por sección.

---

# 39. Límite de complejidad

Si aparece una idea de:

- Twitch OAuth;
- YouTube OAuth;
- live viewers;
- real-time stream state;
- clips ingestion;
- monetization;
- payouts;
- sponsorship marketplace;
- creator analytics avanzados;

NO implementarla.

v0.9 es identidad + discovery + programa de creadores.

---

# 40. Resultado esperado

TFLives debe terminar v0.9 con un flujo completo:

```text
Usuario TFLives
→ solicita ser creador
→ Admin revisa
→ aprobado
→ Creator Profile
→ aparece en Streamers
→ comunidad lo descubre
→ lo sigue / visita / interactúa
```

Todo integrado con la identidad, perfiles, follows, likes y administración ya existentes.
