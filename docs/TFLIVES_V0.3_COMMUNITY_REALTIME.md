# TFLives Web — v0.3.0 Community & Realtime

## Directiva de implementación para Codex

**Repositorio:** `C:\Users\Administrator\Desktop\web-tflives`  
**Branch:** `main`  
**Release:** `v0.3.0 — Community & Realtime`  
**Modelo objetivo:** GPT-5.1 Terra High  
**Stack a preservar:** Next.js App Router + TypeScript + Prisma + Neon PostgreSQL + Better Auth + Vercel  
**Idiomas:** ES/EN  
**Estado previo:** v0.2 Network & Content Core completada

---

# 1. Misión

Implementar de extremo a extremo **v0.3.0 — Community & Realtime** sobre el repositorio existente.

Objetivo: hacer que TFLives se sienta como una plataforma comunitaria viva, integrando chat global, mensajería privada/grupal, respuestas, menciones, reacciones, stickers oficiales, notificaciones mejoradas, bloqueos, reportes, moderación, unread counts y una estrategia realtime compatible con el stack actual.

No es un rewrite. Audita primero, reutiliza lo existente y evita duplicar sistemas.

---

# 2. Arquitectura no negociable

Mantener:

- Next.js App Router
- TypeScript
- Prisma
- Neon PostgreSQL
- Better Auth
- Vercel
- i18n existente
- rebrand actual
- roles/permisos actuales
- mensajería/social/notificaciones existentes como base

Prohibido:

- Supabase
- reemplazar Prisma
- reemplazar Neon
- reemplazar Better Auth
- rehacer todo el sistema social si puede evolucionarse

---

# 3. Auditoría inicial obligatoria

Antes de implementar, inspecciona:

- `package.json`
- `prisma/schema.prisma`
- `src/app`
- APIs de messaging
- APIs de notifications
- APIs sociales
- blocks
- reports
- moderación
- perfiles/usernames
- session/auth helpers
- `/mensajes`
- layouts autenticados
- polling actual
- tests
- i18n
- componentes UI compartidos

Buscar conceptos existentes como:

- Conversation
- Message
- Group
- Notification
- Block
- Report
- Friend
- Follow
- Mention
- Reaction
- unread/read

Para cada requisito:
1. reutiliza;
2. extiende;
3. reemplaza solo si es claramente necesario.

No pares tras la auditoría salvo bloqueo real.

---

# 4. Alcance

Implementar/completar:

1. Chat global flotante.
2. Canal global único.
3. Mensajes de texto.
4. Replies.
5. Mentions `@username`.
6. Reactions.
7. Stickers oficiales.
8. Reportes.
9. Bloqueos.
10. Anti-spam/rate limits.
11. Moderación.
12. Mensajería 1:1 mejorada.
13. Grupos.
14. Solicitudes de conversación donde aplique.
15. Unread counts.
16. Centro de notificaciones mejorado.
17. Preferencias por categoría.
18. Infraestructura realtime o híbrida.
19. Fallback cuando realtime falle.
20. Responsive/accessibility.
21. Tests y build.

---

# 5. Fuera de alcance

No implementar:

- TFL Coins
- wallets
- economía
- cosméticos
- suscripciones
- regalos
- marketplace
- RBAC granular nuevo
- 2FA
- rework grande de perfiles
- progression completa
- streamer ecosystem completo
- analytics avanzada
- clanes
- Roblox
- app móvil

---

# 6. Realtime

Evalúa y elige la solución más adecuada para:

- Vercel
- coste
- mantenimiento
- escalabilidad razonable
- seguridad
- simplicidad
- UX

Candidatos:

- WebSockets propios
- SSE
- Ably
- Pusher
- arquitectura híbrida
- polling optimizado donde sea suficiente

No fuerces WebSockets persistentes si Vercel no es el entorno correcto.

Si hace falta, usa realtime gestionado para eventos y Neon como fuente de verdad.

Documenta:
- tecnología elegida;
- por qué;
- límites;
- fallback;
- variables de entorno nuevas.

---

# 7. Chat global

Un único canal global.

Debe incluir:

- botón flotante persistente;
- panel expandible/minimizable;
- desktop/mobile;
- unread badge;
- loading/error/connection state;
- mensajes recientes;
- paginación hacia atrás;
- replies;
- mentions;
- reactions;
- stickers;
- report;
- block.

No permitir:

- imágenes libres;
- GIFs abiertos;
- audio;
- video;
- archivos arbitrarios.

---

# 8. Mensajes y replies

Reutilizar modelos existentes si es viable.

Mensaje debe soportar razonablemente:

- id;
- author;
- conversation/channel;
- content;
- replyTo opcional;
- createdAt;
- editedAt opcional;
- deletedAt opcional;
- moderation state si aplica.

Replies:
- preview del original;
- navegación al original cuando sea posible;
- validar server-side que el mensaje referido pertenece al mismo contexto.

Soft-delete preferible para preservar replies y moderación.

---

# 9. Menciones

Soportar `@username`.

Requisitos:

- resolver username real;
- resaltado;
- notificación;
- no `@everyone`;
- protección anti-spam;
- evitar notificar self-mention salvo que ya exista comportamiento definido.

---

# 10. Reacciones

Mensajes deben soportar reacciones curadas.

- add/remove toggle;
- conteos;
- estado del usuario actual;
- persistencia;
- realtime o actualización rápida;
- rate limiting.

No introducir un catálogo innecesariamente enorme.

---

# 11. Stickers oficiales

Solo stickers oficiales TFLives.

Campos razonables:

- id
- name
- assetUrl
- enabled
- displayOrder
- category opcional

No uploads libres por usuarios.

Crear gestión administrativa si no existe.

Si no hay object storage completo, URLs HTTPS son suficientes para v0.3.

---

# 12. Bloqueos

Reutilizar sistema actual.

Bloqueo debe impedir al usuario bloqueado:

- iniciar DMs;
- enviar DMs;
- abusar de requests.

En chat global puede ocultarse localmente su contenido para quien bloqueó, pero moderadores deben poder verlo.

Bloqueo no evade moderación.

---

# 13. Reportes y moderación

Reutilizar `/admin/reports` y sistemas existentes.

Reporte debe relacionar:

- reporter
- target message
- target user
- reason
- details opcionales
- status
- timestamp

Moderadores/admins deben poder:

- ver contexto;
- ocultar/eliminar mensaje;
- usar sanciones existentes;
- registrar acción.

No crear un sistema disciplinario paralelo.

---

# 14. Anti-spam

Implementar protección server-side moderada para:

- flood;
- mensajes repetidos;
- burst de mensajes;
- spam de mentions;
- spam de reactions;
- spam de creación de grupos/requests.

Evitar falsos positivos agresivos.

---

# 15. Mensajería privada

Evolucionar sistema existente.

1:1 debe soportar:

- historial;
- mensajes casi realtime;
- replies;
- reactions;
- unread;
- report;
- block.

Evitar conversaciones duplicadas entre el mismo par cuando el modelo actual ya lo resuelva.

---

# 16. Grupos

Soportar:

- crear grupo;
- nombre;
- creator/owner;
- miembros;
- añadir/quitar según permisos;
- abandonar;
- cerrar/eliminar según semántica;
- mensajes;
- replies;
- reactions;
- unread.

No introducir roles complejos de grupo salvo que ya existan.

---

# 17. Solicitudes

Si privacidad existente lo requiere:

- solicitar conversación;
- aceptar;
- rechazar;
- bloquear;
- evitar spam.

No añadir requests donde la conversación ya está permitida.

---

# 18. Unread counts

Implementar para:

- chat global;
- DMs;
- grupos;
- notifications.

Preferir estrategia eficiente como:

- `lastReadAt`
- `lastReadMessageId`

o equivalente reutilizable.

No hacer updates innecesarios por cada mensaje.

Mostrar badges en navegación sin saturar UI.

---

# 19. Notificaciones

Evolucionar centro existente.

Categorías:

- replies
- mentions
- messages
- friend requests
- reactions
- official updates
- moderation/system cuando aplique
- achievements existentes si ya están conectados

Funciones:

- unread/read;
- marcar una;
- marcar todas;
- badge global;
- preferencias.

---

# 20. Preferencias

Permitir activar/desactivar al menos:

- replies
- mentions
- reactions
- friend requests
- messages
- official updates

No permitir desactivar alertas críticas de seguridad/moderación si existen.

---

# 21. Integración UX

Integrar de forma nativa:

- chat global flotante;
- badge mensajes;
- badge notifications;
- acceso a `/mensajes`;
- comunidad.

No saturar navbar.

Mobile:
- panel cerrable;
- safe areas;
- no bloquear navegación;
- layout usable.

---

# 22. Privacidad y autorización

No exponer:

- emails;
- IPs;
- datos de sesión;
- metadata privada;
- estado de bloqueo sensible.

DMs solo visibles para miembros autorizados.

Toda mutación debe validar server-side:

- sesión;
- membership;
- ownership;
- block state;
- moderation role.

Nunca confiar en IDs enviados por cliente sin comprobación.

---

# 23. Prisma y migraciones

Buscar modelos existentes antes de añadir.

Conceptos posibles SOLO si no existen equivalentes:

- MessageReaction
- MessageMention
- ChatSticker
- ConversationReadState
- GlobalChatMessage
- NotificationPreference

Migraciones:

- no destructivas;
- preservar datos;
- sin reset;
- sin seed automático;
- con índices razonables.

No ejecutar migraciones de producción automáticamente.

---

# 24. Paginación

No cargar historiales completos.

Usar cursor pagination.

Chat global y conversaciones deben poder crecer sin cargar cientos/miles de filas en un único request.

---

# 25. Fallback realtime

Si realtime falla:

- mensajes enviados no deben perderse;
- mostrar estado degradado;
- permitir actualización alternativa/polling temporal;
- evitar duplicados al reconectar.

Implementar idempotencia cuando aporte valor.

---

# 26. UX de envío

- optimistic UI si es seguro;
- sending state;
- retry;
- evitar duplicados;
- autoscroll solo si el usuario está cerca del final;
- no forzar scroll mientras lee historial.

---

# 27. Seguridad

Revisar:

- XSS;
- HTML/Markdown;
- URLs;
- mention parsing;
- payload size;
- message length;
- IDOR;
- conversation enumeration;
- authorization bypass;
- spam.

Sanitizar contenido cuando corresponda.

Establecer límites razonables.

---

# 28. i18n

Todo texto UI nuevo debe usar el sistema actual ES/EN.

No hardcodear UI nueva.

Los mensajes de usuarios no se traducen automáticamente.

---

# 29. Accesibilidad

- keyboard navigation;
- focus visible;
- semantic controls;
- labels;
- aria-live cuando convenga;
- contraste;
- reduced motion;
- close buttons claros;
- pickers/menus navegables.

---

# 30. Responsive

Revisar especialmente:

- chat flotante;
- conversaciones;
- lista de chats;
- grupos;
- notification center;
- reaction picker;
- sticker picker.

Desktop y mobile deben ser usables.

---

# 31. Performance

Evitar:

- polling cada segundo;
- refetch completo;
- renderizar historiales enteros;
- librerías grandes sin justificar.

Preferir:

- updates incrementales;
- paginación;
- caché;
- lazy loading;
- carga diferida de paneles.

---

# 32. Admin

Evolucionar admin existente para:

- moderación chat;
- reports;
- stickers oficiales;
- mensajes reportados;
- acciones disciplinarias existentes.

No crear otro panel.

---

# 33. Tests

Mínimo:

## Chat global
- send
- receive
- reply
- mention
- reaction
- sticker
- report
- block
- rate limit
- pagination

## DMs/grupos
- 1:1
- group
- membership
- unauthorized blocked
- unread
- leave
- requests si aplican

## Notifications
- mention -> notification
- reply -> notification
- preference respected
- mark read
- mark all read

## Security
- non-member cannot fetch conversation
- blocked user cannot DM
- cannot mutate another user's message
- moderation endpoints protected
- malformed payload rejected

---

# 34. Validación

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
```

Si una migración es necesaria:
- generarla;
- documentarla;
- no aplicarla a producción automáticamente.

No hacer push.

---

# 35. Criterios de aceptación

v0.3 completa si:

1. Chat global usable.
2. Desktop/mobile correcto.
3. Nuevos mensajes suficientemente inmediatos.
4. Replies funcionales.
5. Mentions funcionales y notifican.
6. Reactions funcionales.
7. Stickers oficiales funcionales.
8. Reports funcionales.
9. Blocking funcional.
10. Anti-spam server-side.
11. DMs 1:1 funcionales.
12. Grupos funcionales.
13. Membership protegido.
14. Unread counts funcionales.
15. Notifications mejoradas.
16. Preferencias existen.
17. Realtime tiene fallback.
18. No duplica sistemas existentes.
19. ES/EN completo para UI nueva.
20. Sin Supabase.
21. Better Auth intacto.
22. Prisma/Neon intactos.
23. Build pasa.
24. Tests críticos pasan.
25. No economía/premium.
26. No push automático.

---

# 36. Prohibiciones

No:

- Supabase
- Firebase
- reemplazar Better Auth
- reemplazar Prisma
- reemplazar Neon
- duplicar notifications
- duplicar reports
- duplicar blocks
- duplicar social graph
- `@everyone`
- uploads libres en chat
- GIFs abiertos
- audio/video
- economía
- subscriptions
- RBAC granular
- rediseño global
- secrets en repo
- `.env` con valores reales
- `prisma db push` en producción
- `migrate reset`
- migraciones destructivas
- push automático

---

# 37. Reglas de eficiencia para GPT-5.1 Terra High

Esta tarea debe intentar resolverse en un pase grande.

- Lee este archivo completo.
- Audita una vez.
- No devuelvas un plan antes de implementar salvo bloqueo real.
- Reutiliza todo lo posible.
- Agrupa cambios Prisma.
- No preguntes por decisiones ya resueltas aquí.
- Toma decisiones conservadoras y coherentes.
- Evita dependencias innecesarias.
- Evita refactors ajenos.
- Corrige errores causados por tus cambios.
- No inventes trabajo para parecer productivo.

---

# 38. Git

Trabajar en:

`C:\Users\Administrator\Desktop\web-tflives`

Branch:

`main`

No:
- commit automático salvo petición explícita;
- push;
- force push;
- rewrite history.

Dejar cambios listos para revisión.

---

# 39. Reporte final obligatorio

Responder con:

## Implemented
## Reused / evolved
## Database changes
## Realtime architecture
## Public/user-facing changes
## Admin/moderation changes
## Environment variables
## Validation performed
## Known limitations
## Manual steps required
## Files of special importance

No cerrar con un simple “done”.

---

# 40. Resultado esperado

Al terminar v0.3, TFLives debe sentirse como una comunidad viva:

- usuarios conversan;
- reciben mensajes;
- ven actividad nueva;
- son mencionados;
- reaccionan;
- usan stickers;
- bloquean/reportan;
- staff modera;
- todo se integra con la plataforma actual.

Debe complementar Discord, no intentar reemplazarlo por completo.
