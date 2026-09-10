# TFLives Web — v0.2.0 Network & Content Core

## Directiva de implementación para Codex

**Repositorio local:** `C:\Users\Administrator\Desktop\web-tflives`  
**Branch:** `main`  
**Release objetivo:** `v0.2.0 — Network & Content Core`  
**Stack que debe mantenerse:** Next.js App Router + TypeScript + Prisma + Neon PostgreSQL + Better Auth  
**Deploy:** Vercel  
**Idiomas:** Español e inglés

---

# 1. Misión

Implementar de extremo a extremo la update **v0.2.0 — Network & Content Core** sobre el repositorio existente.

El objetivo es convertir la base actual de TFLives en una plataforma realmente operable para contenido y TFL Network, completando la capa pública/editorial principal sin rehacer sistemas estables.

Esta tarea **no es un rewrite**.

Antes de crear nuevas estructuras:
1. Audita el repositorio.
2. Detecta implementaciones existentes.
3. Reutiliza y evoluciona lo que ya funcione.
4. Evita duplicar modelos, APIs, componentes, CMS o paneles.
5. Mantén intactas las decisiones técnicas principales.

El resultado final debe permitir que el staff gestione el contenido cotidiano **desde la propia web**, sin editar código fuente.

---

# 2. Contexto de producto

TFLives es el hub central de Time For Lives: marca, comunidad, TFL Network, contenido editorial y ecosistema digital.

TFL Network es una de sus áreas principales, pero Minecraft no debe absorber la identidad completa de TFLives.

La identidad visual actual debe conservarse:
- premium;
- moderna;
- tecnológica;
- dark-first;
- azul como color principal;
- cuidada;
- clara;
- con animación equilibrada;
- orientada a comunidad.

No rediseñes toda la web.

---

# 3. Arquitectura no negociable

Mantener:

- Next.js con App Router.
- TypeScript.
- Prisma.
- Neon PostgreSQL.
- Better Auth.
- Vercel.
- Arquitectura i18n existente.
- Sistema de perfiles/sesiones/social existente.
- Panel administrativo existente cuando sea reutilizable.
- Rebrand y sistema visual actual.
- Sistema de publicaciones existente como base del CMS.

**Prohibido introducir Supabase.**

No reemplazar Better Auth, Prisma ni Neon.

---

# 4. Auditoría obligatoria antes de implementar

Inspecciona como mínimo:

- `package.json`
- `prisma/schema.prisma`
- árbol de `src/app`
- APIs existentes
- posts/noticias actuales
- modalidades actuales
- admin actual
- Team/equipo actual
- comunidad/actividad existente
- integración Discord existente
- helpers de sesión/autorización
- middleware
- mensajes i18n
- componentes compartidos
- home actual
- página Network actual
- navegación/footer
- estrategia de caché y fetch
- validación de formularios

Para cada feature pedida:
- busca primero una implementación existente;
- extiéndela si es razonable;
- reemplázala solo si está claramente mal planteada;
- no crees equivalentes duplicados.

---

# 5. Alcance de v0.2.0

Implementar/completar:

1. TFL Network pública.
2. Modalidades 100% dinámicas y administrables.
3. Estado real de Minecraft.
4. Página pública de estado.
5. Evolución del CMS editorial.
6. Tipos News / Update / Changelog / Event / Maintenance.
7. Wiki completa administrada por staff.
8. Equipo público dinámico.
9. Trayectoria/timeline administrable.
10. Página de comunidad.
11. Página puente de tienda.
12. Home conectada a datos reales.
13. Estadísticas de Discord.
14. Administración desde la propia web para todo lo anterior.
15. Empty states correctos.
16. i18n ES/EN.
17. Responsive y accesibilidad de las zonas tocadas.
18. Caché y tolerancia a fallos en integraciones externas.

---

# 6. Fuera de alcance

No implementar ahora:

- chat global realtime;
- nueva plataforma WebSocket;
- realtime global de mensajes/notificaciones;
- TFL Coins;
- wallet;
- transferencias;
- cosméticos económicos;
- suscripciones;
- regalos;
- marketplace;
- full streamer ecosystem;
- detección automática de directos;
- RBAC granular nuevo;
- 2FA;
- reescritura OAuth;
- clanes;
- Roblox;
- app móvil;
- analytics avanzada.

No expandir esta update hacia esas áreas.

---

# 7. Principio de administración

Todo contenido operativo nuevo o evolucionado debe ser gestionable desde TFLives.

Puede usarse:

- `/admin/...`; o
- edición contextual visible solo para staff.

Elige según la arquitectura existente.

Requisitos:
- usuarios normales nunca ven controles administrativos;
- autorización también se valida en servidor;
- contenido vive en DB;
- nada importante queda hardcodeado;
- staff no necesita editar código para operar la plataforma;
- operaciones destructivas requieren confirmación.

Preferir el admin existente antes que crear un segundo sistema.

---

# 8. Política de datos

## Producción
Cero contenido dummy.

Si una sección está vacía, mostrar empty state elegante.

Ejemplos:
- Wiki: “No hay artículos publicados todavía.”
- Timeline: “Aún no hay hitos publicados.”
- Equipo: “El equipo público aún no ha sido configurado.”
- Posts: “No hay publicaciones disponibles.”

Si el visitante tiene permisos, el empty state puede incluir CTA administrativo.

## Desarrollo
Se permite seed opcional y explícito, por ejemplo `npm run db:seed`.

Nunca ejecutar seeds automáticamente en producción.

---

# 9. Modalidades

No hardcodear modalidades actuales.

Staff debe poder:
- crear;
- editar;
- publicar/despublicar;
- reordenar;
- cambiar estado;
- archivar;
- configurar metadata visual.

Campos mínimos razonables:
- id;
- slug;
- nombre;
- descripción corta;
- contenido/descripción larga opcional;
- estado;
- orden;
- published/visible;
- versión Minecraft o rango;
- icono opcional;
- banner/hero opcional;
- timestamps.

Estados sugeridos:
- `ONLINE`
- `MAINTENANCE`
- `COMING_SOON`
- `OFFLINE`
- `ARCHIVED`

Ajustar a convenciones Prisma existentes.

---

# 10. Estado real de TFL Network

Consultar:

**Host:** `mc.tflives.com`  
**Puerto:** `25565`

Implementar un servicio server-side.

Mostrar cuando sea técnicamente fiable:
- reachable/unreachable;
- online/offline;
- jugadores actuales;
- máximo;
- MOTD si aporta valor;
- versión/protocolo;
- timestamp;
- latencia/duración si es fiable.

No filtrar:
- secretos;
- infraestructura interna;
- backends privados.

La caída de Minecraft **nunca** debe romper la web.

Usar caché/revalidación. Aproximadamente 15–60 s es razonable.

No hacer polling TCP desde el navegador.

Si se necesita paquete npm, escoger uno mantenido y compatible con Node/Vercel.

Si Edge no soporta la técnica elegida, mantener esa ruta/función en runtime Node; no mover toda la app a Edge.

---

# 11. Página pública de estado

Crear/completar:

`/[locale]/network/estado`

Debe incluir:
- estado global;
- jugadores;
- IP `mc.tflives.com`;
- acción copiar IP;
- versión si se conoce;
- modalidades/status DB cuando aplique;
- mantenimiento;
- última actualización;
- fallback elegante.

No inventar jugadores por modalidad si solo hay datos globales.

La arquitectura debe permitir integraciones por backend en el futuro.

---

# 12. CMS editorial

Evolucionar el sistema existente. No crear un segundo CMS.

Tipos editoriales:

- `NEWS`
- `UPDATE`
- `CHANGELOG`
- `EVENT`
- `MAINTENANCE`

Campos razonables:
- title;
- slug;
- excerpt;
- content;
- type;
- state;
- author;
- publishedAt;
- scheduledAt opcional;
- createdAt;
- updatedAt;
- cover opcional;
- tags/categories compatibles;
- contenido traducible;
- metadata SEO si encaja.

Estados recomendados:
- draft;
- scheduled;
- published;
- archived.

Preservar comentarios/reacciones existentes.

No romper URLs existentes sin necesidad.

Migrar contenido existente de forma segura.

---

# 13. Editor editorial/Wiki

Staff debe disponer de una experiencia real de edición.

Preferir:
- editor visual;
- contenido estructurado;
- headings;
- listas;
- links;
- blockquotes;
- preview;
- save/publish claro.

Reutilizar editor/dependencias existentes si existen.

No añadir un framework enorme si no hace falta.

Sanitizar contenido renderizado cuando corresponda.

---

# 14. Wiki

Crear/completar:

- `/{locale}/network/wiki`
- `/{locale}/network/wiki/[slug]`

Requisitos:
- edición solo por staff;
- artículos públicos solo si están publicados;
- categorías;
- tags;
- modalidad asociada opcional;
- buscador;
- tabla de contenidos;
- artículos relacionados;
- última actualización;
- estados de publicación;
- bilingual-ready;
- empty state elegante.

Modelos conceptuales posibles:
- WikiArticle
- WikiCategory
- WikiTag

**No crearlos automáticamente si ya existen equivalentes reutilizables.**

No introducir Algolia/Elasticsearch para v0.2. PostgreSQL es suficiente.

Artículo:
- title;
- slug;
- excerpt;
- content;
- state;
- category;
- tags;
- modality opcional;
- author/editor;
- timestamps;
- publishedAt;
- estrategia de locale compatible con el proyecto.

---

# 15. UX de Wiki

Índice:
- búsqueda;
- categorías;
- recientes/relevantes;
- filtro por modalidad si aporta valor;
- empty state.

Artículo:
- título;
- metadata;
- TOC generado;
- cuerpo legible;
- categoría/tags;
- relacionados;
- updatedAt;
- breadcrumbs;
- shortcut editar para staff.

No abusar de efectos visuales en lectura larga.

---

# 16. Equipo público

Crear/completar:

`/[locale]/equipo`

Debe ser DB-driven.

Reutilizar Team existente si lo hay.

Administrable:
- nombre/displayName;
- rol/título;
- bio opcional;
- avatar;
- redes;
- orden;
- visible;
- grouping opcional si ya encaja.

No hardcodear staff actual.

---

# 17. Trayectoria

Crear/completar:

`/[locale]/trayectoria`

Timeline dinámica.

Staff:
- crear;
- editar;
- reordenar;
- publicar/despublicar;
- archivar/eliminar.

Campos:
- título;
- fecha o date label;
- descripción;
- orden/cronología;
- proyecto/categoría opcional;
- metadata visual opcional;
- published.

No hardcodear historia de TFLives.

Debe funcionar con 0, 1 o muchos hitos.

---

# 18. Comunidad

Crear/completar:

`/[locale]/comunidad`

Scope v0.2:
- feed oficial;
- actividad comunitaria relevante;
- interacciones públicas existentes;
- CTA Discord;
- descubrimiento de otras áreas.

**No permitir publicaciones libres de usuarios todavía.**

Reutilizar activity/comments/reactions/friends/follows existentes.

Debe aportar valor a invitados y usuarios autenticados.

---

# 19. Tienda

Crear/completar:

`/[locale]/tienda`

Destino oficial:

`https://shop.tflives.com`

Debe ser una bridge page, no un redirect invisible.

Puede incluir:
- explicación;
- CTA principal;
- aviso de sitio externo;
- navegación externa segura.

No duplicar catálogo ni checkout.

---

# 20. Discord

Guild ID:

`1246905708541120593`

Auditar integración existente antes de crear otra.

Estadísticas públicas posibles:
- member count;
- online count solo si es fiable;
- CTA/invite.

Secrets mediante env.

Nunca commitear bot token.

Si faltan credenciales:
- build debe seguir funcionando;
- Home no puede romperse;
- mostrar fallback.

Puede usarse endpoint/widget público si es suficiente y fiable.

No usar el iframe de Discord como solución primaria salvo que realmente aporte valor.

Cachear estadísticas varios minutos.

---

# 21. Home

No rehacer desde cero.

Preservar rebrand.

Conectar a datos reales:
- identidad/hero;
- proyectos/ecosistema;
- últimas publicaciones;
- estado Network;
- jugadores;
- stats Discord;
- modalidades destacadas;
- preview equipo;
- preview trayectoria cuando tenga sentido;
- CTAs.

Nada de métricas falsas.

Fallos externos no deben bloquear el home.

---

# 22. Admin/editorial

Proveer gestión para:
- modalidades;
- posts;
- wiki;
- equipo;
- trayectoria.

Usar navegación/layout admin existente.

Funciones:
- list/search/filter cuando aporte valor;
- create;
- edit;
- publish/unpublish;
- archive/delete con confirmación;
- loading;
- empty;
- validation;
- error feedback.

No crear un CRUD genérico visualmente pobre.

Edición inline puede complementar el admin, no fragmentarlo.

---

# 23. Autorización

No rediseñar RBAC todavía.

Usar roles/helpers existentes.

Toda mutación:
- resolver usuario autenticado server-side;
- comprobar rol/capacidad con helpers actuales;
- validar payload;
- responder 401/403 correctamente.

Nunca confiar solo en un botón oculto.

Drafts nunca salen en APIs públicas.

---

# 24. Prisma y migraciones

Seguir convenciones actuales.

Antes de crear modelo, buscar equivalente.

No hacer resets destructivos.

No pedir borrar producción.

Migraciones deben preservar datos.

Añadir índices solo donde sean útiles:
- slug;
- published/state;
- type;
- category;
- order;
- publishedAt;
- relaciones frecuentes.

Documentar cualquier comando manual requerido.

---

# 25. Storage/media

Supabase Storage no vuelve.

Auditar estrategia actual.

Para v0.2:
- reutilizar abstracción actual;
- no meter un gran sistema nuevo salvo necesidad real;
- no usar almacenamiento DB para media editorial ilimitada sin evaluar impacto;
- no bloquear contenido textual por falta de object storage.

Si hace falta storage futuro, aislarlo detrás de una interfaz y documentarlo.

---

# 26. APIs

Seguir patrón existente.

No crear APIs por costumbre si server actions/server components resuelven mejor.

Integraciones externas:
- timeouts;
- catch;
- payload normalizado;
- sin secretos;
- validación.

Mantener contratos simples.

---

# 27. i18n

Todo texto UI nuevo en ES/EN usando el mecanismo actual.

No hardcodear strings si existen archivos de mensajes.

Contenido editorial debe estar preparado para traducción.

No obligar a crear ambas traducciones a la vez salvo que la arquitectura existente lo requiera.

No introducir otro framework i18n.

---

# 28. Accesibilidad

En superficies tocadas:
- headings correctos;
- labels;
- focus visible;
- teclado;
- semántica button/link;
- contraste;
- reduced motion;
- errores comprensibles.

Nada crítico solo por hover.

---

# 29. Responsive

Revisar:
- Network;
- status;
- Wiki index;
- Wiki article;
- admin;
- comunidad;
- timeline;
- equipo;
- tienda.

Evitar overflow horizontal.

Tablas admin pueden convertirse a cards en móvil.

---

# 30. Libertad visual

Se permiten mejoras con criterio.

Reglas:
- mantener identidad TFLives;
- mantener rebrand;
- reutilizar tokens/componentes;
- no rediseñar páginas ajenas;
- no sacrificar rendimiento;
- no sobrecargar admin;
- mantener dark/light donde aplique.

---

# 31. Performance

- server-side donde convenga;
- caché externa;
- evitar waterfalls;
- no inflar bundles;
- cargar editores pesados solo en admin;
- preservar optimizaciones Next.

Home no debe depender síncronamente de múltiples APIs inestables.

---

# 32. Manejo de errores

Minecraft falla:
- fallback; no crash.

Discord falla:
- stats omitidas/unavailable; CTA sigue.

DB vacía:
- empty state.

Admin inválido:
- error accionable.

Unauthorized:
- 401/403.

Missing:
- 404 consistente.

---

# 33. SEO mínimo de v0.2

Sin hacer todavía la futura gran update SEO:

- title;
- description;
- metadata adecuada;
- locale/canonical consistente;
- metadata útil en artículos/wiki si ya existe soporte.

No construir un sistema gigante.

---

# 34. Testing

Usar framework existente.

Mínimo:

## Público
- Network carga.
- caída Minecraft es graceful.
- Wiki empty state.
- artículo publicado visible.
- draft no visible.
- Team vacío/lleno.
- Timeline vacío/lleno.
- Comunidad carga.
- tienda apunta a `https://shop.tflives.com`.
- Home tolera fallos Discord/Minecraft.

## Admin
- usuario no autorizado no muta;
- staff autorizado sí;
- publicaciones respetan estado;
- modalidades persisten;
- Wiki CRUD;
- Timeline CRUD;
- Team management;
- editorial types.

## Datos
- slugs;
- required fields;
- migración no destructiva.

---

# 35. Validación

Usar scripts reales del repo.

Intentar como mínimo equivalentes de:

```bash
npm install
npm run db:generate
npm run lint
npm run typecheck
npm run build
```

Si `typecheck` no existe, usar equivalente apropiado como `npx tsc --noEmit`.

No ignorar errores del compilador.

Production build es release gate.

---

# 36. Criterios de aceptación

v0.2 está completa solo si:

1. Modalidades DB-driven.
2. Staff puede gestionarlas sin código.
3. Status consulta `mc.tflives.com:25565`.
4. Caída de Network no rompe páginas.
5. Existe status page.
6. CMS soporta News/Update/Changelog/Event/Maintenance.
7. CMS administrable.
8. Wiki completa como foundation.
9. Wiki vacía se ve bien.
10. Wiki administrable por staff.
11. Drafts no son públicos.
12. Equipo dinámico/administrable.
13. Trayectoria dinámica/administrable.
14. Comunidad funcional sin user posts libres.
15. Tienda apunta a `https://shop.tflives.com`.
16. Home usa datos reales.
17. Discord guild `1246905708541120593` integrado/configurado.
18. Falta de Discord credentials no rompe build.
19. No hay dummy production data.
20. Nuevos textos siguen ES/EN.
21. Mutaciones admin protegidas server-side.
22. Cero Supabase.
23. Better Auth intacto.
24. Prisma + Neon intactos.
25. No se rompen intencionalmente sistemas sociales existentes.
26. Build de producción pasa o cualquier bloqueo externo queda documentado con evidencia.

---

# 37. Prohibiciones

No:

- Supabase;
- auth rewrite;
- reemplazar Better Auth;
- reemplazar Prisma;
- reemplazar Neon;
- segunda base de datos;
- segundo CMS;
- Team duplicado;
- modalities duplicadas;
- notifications duplicadas;
- hardcodear modalidades;
- hardcodear staff;
- hardcodear timeline;
- fake player counts;
- fake Discord counts;
- fake Wiki;
- lorem ipsum producción;
- debilitar auth;
- filtrar drafts;
- secrets client-side;
- commit `.env`;
- commit bot tokens;
- realtime chat;
- TFL Coins;
- subscriptions;
- dependencias grandes sin justificar;
- borrar funcionalidad para simplificar;
- rediseñar zonas ajenas;
- obligar al staff a editar código.

---

# 38. Reglas de eficiencia

Esta directiva busca una sola ejecución grande o el menor número de pases.

- Auditar primero.
- Agrupar cambios Prisma.
- Reutilizar componentes/formularios.
- Reutilizar validación.
- Reutilizar renderers.
- No volver a auditar todo después de cada microcambio.
- No detenerse a pedir confirmación por decisiones no destructivas que este documento ya resuelve.
- No llenar el repo con documentación innecesaria.
- Priorizar código funcional y validado.

---

# 39. Git

Trabajar en:

`C:\Users\Administrator\Desktop\web-tflives`

Branch:

`main`

No:
- force push;
- reescribir historial;
- borrar commits ajenos.

El usuario revisará antes del push cuando sea posible.

---

# 40. Reporte final obligatorio

Al terminar, responder usando exactamente estas secciones:

## Implemented
Funcionalidad terminada por subsistema.

## Reused / evolved
Qué sistemas existentes se ampliaron.

## Database changes
Modelos/campos/enums/indexes/migraciones.

## Public routes
Rutas nuevas o modificadas.

## Admin/editorial routes
Superficies de gestión.

## External integrations
Minecraft y Discord, incluyendo caché/revalidación.

## Environment variables
Solo nombres. Nunca valores secretos.

## Validation performed
Comandos exactos + resultado.

## Known limitations
Solo limitaciones reales.

## Manual steps required
Migración DB, env Vercel, etc.

## Files of special importance
Archivos principales modificados.

No cerrar con un simple “done”.

---

# 41. Resultado esperado

Al finalizar v0.2, TFLives debe sentirse como una plataforma viva y operable:

- Network real;
- status real;
- publicaciones reales;
- Wiki mantenible;
- equipo mantenible;
- trayectoria mantenible;
- comunidad conectada;
- home alimentada por datos;
- todo gestionable desde la propia web.

El staff no debe depender de editar código para mantener el contenido cotidiano.
