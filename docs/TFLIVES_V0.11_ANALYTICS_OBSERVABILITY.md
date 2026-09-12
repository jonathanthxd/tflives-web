# TFLives Web — v0.11.0 Analytics & Observability
## Directiva compacta para Codex — GPT-5.6 Terra Extra High (Standard)

**Repositorio:** `C:\Users\Administrator\Desktop\web-tflives`  
**Branch:** `main`  
**Release:** `v0.11.0 — Analytics & Observability`  
**Prioridad:** medir salud, uso y errores reales de TFLives sin convertir la plataforma en un sistema invasivo de tracking  
**Estado base:** v0.10 Admin Platform funcional + perfiles + comunidad + progresión + economía + cosméticos + Premium + creators + moderación  
**Stack obligatorio:** Next.js App Router + TypeScript + Prisma + Neon PostgreSQL + Better Auth + Vercel + next-intl

---

# 1. Objetivo

v0.11 debe dar a TFLives una capa seria y útil de **analítica interna + observabilidad del producto**.

Debe permitir responder:

```text
¿Cuánta gente usa realmente TFLives?
¿Qué funciones se usan?
¿Qué está creciendo?
¿Qué flujos fallan?
¿Qué errores están apareciendo?
¿Cómo se comporta la plataforma hoy vs. hace 7/30 días?
```

La meta NO es espiar usuarios ni construir una plataforma de BI.

La meta es que Admin/Dev puedan entender la salud real del producto con datos internos, mínimos y útiles.

---

# 2. Regla de eficiencia

Haz UNA auditoría dirigida únicamente de:

- Admin Platform v0.10;
- User/Profile/session patterns;
- chat/global messages;
- DMs;
- follows/likes/friends;
- progression/achievements;
- economy/ledger;
- cosmetics/purchases/equip;
- Premium;
- creators/applications;
- moderation;
- existing logs/error boundaries;
- existing telemetry/analytics if any;
- Prisma schema;
- relevant tests.

Después implementa directamente.

NO:

- broad repo audit;
- refactor general;
- external analytics vendor integration;
- Sentry;
- OpenTelemetry stack;
- Grafana;
- Prometheus;
- Vercel Analytics dependency;
- Google Analytics;
- advertising trackers;
- session replay;
- heatmaps;
- fingerprinting.

---

# 3. Principio de producto

Separar claramente:

## Product analytics
Mide uso agregado de funcionalidades.

## Operational observability
Mide errores y señales técnicas de salud.

## Admin audit
Ya existe y NO debe duplicarse.

No usar `AdminActionLog` como sistema de analytics.

---

# 4. Alcance obligatorio

Implementar:

1. modelo first-party de eventos analíticos;
2. tracking server-side en eventos clave;
3. agregación por ventanas de tiempo;
4. panel `/admin/analytics`;
5. métricas de crecimiento/actividad;
6. métricas por módulos;
7. embudos pequeños y útiles;
8. errores de aplicación resumidos;
9. health summary;
10. filtros 7d / 30d / 90d;
11. retención/limpieza razonable;
12. privacidad;
13. ES/EN;
14. tests críticos;
15. una migración Prisma aditiva si es necesaria;
16. build final.

---

# 5. Fuera de alcance

NO implementar:

- Google Analytics;
- Mixpanel;
- PostHog;
- Amplitude;
- Sentry;
- Datadog;
- New Relic;
- Grafana;
- Prometheus;
- OpenTelemetry infra;
- session replay;
- heatmaps;
- mouse tracking;
- ad tracking;
- cross-site tracking;
- fingerprinting;
- IP profiling;
- device fingerprinting;
- marketing attribution avanzada;
- cohort builder complejo;
- custom SQL analytics;
- BI dashboards;
- alerting externo;
- infrastructure/VPS monitoring.

---

# 6. Modelo analítico

Preferir un modelo first-party pequeño.

Concepto:

```text
AnalyticsEvent
- id
- type
- userId nullable
- source
- metadata limitada / segura
- createdAt
```

Campos adicionales solo si realmente aportan.

No guardar payloads enormes.

No guardar snapshots completos de usuarios.

No guardar texto de chats/DMs dentro de analytics.

---

# 7. Tipos de evento

Crear enum/tipos allowlisted.

Ejemplos:

```text
USER_SIGNED_UP
PROFILE_COMPLETED
GLOBAL_MESSAGE_SENT
DM_SENT
FOLLOW_CREATED
PROFILE_LIKED
FRIENDSHIP_ACCEPTED
LEVEL_UP
ACHIEVEMENT_UNLOCKED
COINS_EARNED
COINS_SPENT
COSMETIC_PURCHASED
COSMETIC_EQUIPPED
CREATOR_APPLICATION_SUBMITTED
CREATOR_APPLICATION_APPROVED
PREMIUM_GRANTED
REPORT_CREATED
```

Adaptar al código real.

No registrar eventos redundantes si la información puede derivarse eficientemente de tablas existentes.

---

# 8. Derivar antes que duplicar

Regla importante:

Si una métrica puede calcularse barato y correctamente desde una tabla existente, NO crear un AnalyticsEvent duplicado.

Ejemplos:

- TFL Coins gastados → puede derivarse del ledger;
- cosméticos comprados → ownership/ledger;
- achievements → tablas de achievements;
- creators activos → CreatorProfile;
- Premium activo → entitlement.

Usar AnalyticsEvent solo para señales que no estén ya representadas de forma útil.

---

# 9. Tracking server-side

Preferir instrumentación server-side dentro de servicios existentes.

NO confiar en cliente para eventos de negocio.

Ejemplo:

```text
servicio real ejecuta acción
→ acción se confirma
→ analytics registra señal
```

No:

```text
cliente dice "compré cosmético"
→ analytics lo cree
```

---

# 10. Tracking client-side

Solo usarlo donde tenga sentido técnico, por ejemplo:

- Web Vitals;
- error boundary;
- navegación/performance agregada.

Debe ser:
- mínimo;
- sin contenido sensible;
- sin identificadores de dispositivo persistentes;
- sin fingerprinting.

---

# 11. Privacidad

No guardar en analytics:

- contraseñas;
- tokens;
- cookies;
- mensajes de chat;
- DMs;
- bios;
- emails salvo necesidad administrativa estricta (preferir no);
- IPs completas;
- OAuth tokens;
- motivos privados de moderación;
- notas administrativas;
- contenido personal arbitrario.

Preferir `userId` interno nullable cuando haga falta correlación.

---

# 12. Métricas principales

Panel principal:

```text
Usuarios totales
Usuarios nuevos
Usuarios activos
DAU
WAU
MAU
```

Si DAU/WAU/MAU requieren una definición explícita:

**Activo** = usuario autenticado que realizó al menos una acción significativa.

No contar cada pageview como “activo” si genera ruido.

---

# 13. Definición de actividad

Actividad significativa puede incluir:

- mensaje global;
- DM;
- follow;
- like;
- friendship;
- achievement;
- level-up;
- compra/equip de cosmético;
- creator application;
- otra interacción real.

Centralizar definición.

No inflar métricas con polling/API reads.

---

# 14. Métricas sociales

Mostrar agregados como:

```text
Mensajes globales
DMs enviados
Nuevos follows
Likes de perfiles
Nuevas amistades
```

No mostrar contenido.

No hacer rankings de usuarios individuales en v0.11.

---

# 15. Métricas de progresión

Mostrar:

```text
Level-ups
Achievements unlocked
Usuarios que completaron perfil
Nivel promedio si es barato y útil
```

No crear leaderboard.

---

# 16. Métricas económicas

Reutilizar ledger.

Mostrar:

```text
TFL Coins emitidos
TFL Coins gastados
Balance total circulante
Compras de cosméticos
```

Separar:

- créditos;
- débitos;
- admin adjustments cuando sea útil.

No tratar TFL Coins como dinero real.

No usar símbolos monetarios reales.

---

# 17. Cosméticos

Mostrar:

```text
Compras totales
Equipamientos
Cosméticos activos
Top cosméticos por compras
```

Top pequeño, por ejemplo 5.

No crear analytics de marketplace inexistente.

---

# 18. Creators

Mostrar:

```text
Solicitudes
Aprobaciones
Creadores activos
Featured
```

Opcional:
- tasa simple solicitud → aprobación.

No integrar viewers externos.

---

# 19. Moderación

Mostrar agregados:

```text
Reportes creados
Reportes abiertos
Apelaciones
Tiempo medio de resolución
```

Solo si puede calcularse con datos existentes de forma fiable.

No exponer detalles privados en analytics.

---

# 20. Embudos

Mantener máximo 2–3 embudos simples.

Ejemplo onboarding:

```text
Cuenta creada
→ perfil completado
→ primera interacción social
```

Ejemplo economy:

```text
Usuario con TFL Coins
→ compra cosmético
→ equipa cosmético
```

No construir funnel builder genérico.

---

# 21. Comparación temporal

Para tarjetas principales mostrar:

```text
Últimos 7 días
vs
7 días anteriores
```

o equivalente para 30/90 días.

Mostrar:
- valor actual;
- delta absoluto/porcentual cuando tenga sentido.

Evitar porcentajes absurdos cuando baseline = 0.

---

# 22. Filtros

Panel debe soportar:

```text
7 días
30 días
90 días
```

Opcional:
```text
Hoy
```

solo si es trivial.

No crear date-range picker complejo.

---

# 23. Charts

Usar gráficos solo cuando aporten claridad.

Máximo:
- serie temporal actividad;
- distribución/uso por módulo;
- quizá economía.

No llenar la página de gráficas.

No añadir librería pesada si ya existe una opción simple con CSS/SVG/componentes actuales.

Si se requiere librería, justificar y mantenerla pequeña.

---

# 24. Página `/admin/analytics`

Crear una vista clara con secciones:

```text
Resumen
Actividad
Comunidad
Progresión
Economía
Cosméticos
Creators
Moderación
Salud técnica
```

Puede usar tabs/sections.

No hacer una sola página kilométrica si ya existe patrón de subnavegación.

---

# 25. Dashboard v0.10

Integrar solo un resumen pequeño en `/admin`.

Ejemplo:

```text
Usuarios activos 7d
Errores 24h
Eventos significativos 24h
```

El detalle vive en `/admin/analytics`.

No duplicar todo.

---

# 26. Observabilidad — errores

Crear un modelo o mecanismo ligero para errores de aplicación si no existe.

Concepto:

```text
ApplicationError
- id
- fingerprint
- area
- message sanitized
- count
- firstSeenAt
- lastSeenAt
- lastStatus
- metadata segura
```

Preferir agregación/fingerprint a guardar miles de duplicados.

---

# 27. Error fingerprint

Fingerprint debe basarse en datos técnicos seguros.

Ejemplo:

```text
area + errorCode + normalizedMessage
```

No incluir:
- user content;
- token;
- email;
- full URL con secrets;
- stack completo público.

Stack técnico puede quedar server log si ya existe.

---

# 28. Captura de errores

Instrumentar de forma dirigida:

- API/services principales;
- error boundary global;
- operaciones críticas como economy/cosmetics/creator/admin.

No envolver cada función del repo.

No ocultar errores.

Registrar y seguir propagando/respondiendo correctamente.

---

# 29. Salud técnica

Panel simple:

```text
Estado general
Errores últimas 24h
Errores no resueltos
Último error
Último evento analítico
```

Opcional, si es barato y seguro:
- latencia media aproximada de endpoints instrumentados.

No construir APM.

---

# 30. Estados de error

Permitir marcar error agregado como:

```text
OPEN
RESOLVED
IGNORED
```

Solo ADMIN.

Esto es observabilidad, no ticketing.

No crear workflow complejo.

---

# 31. Retención

Definir límites.

Recomendación:

- eventos analíticos raw: 90 días;
- errores agregados: conservar más tiempo razonable;
- métricas históricas pueden derivarse mientras haya datos.

Implementar helper/job de limpieza invocable de forma segura.

Si no existe cron infra:
- crear función/server action/script seguro;
- documentar uso;
- NO inventar scheduler externo.

---

# 32. Volumen

Evitar eventos de alta frecuencia innecesarios.

NO registrar:

- cada polling;
- cada render;
- cada API GET;
- cada presencia;
- cada keystroke;
- cada scroll;
- cada hover.

Registrar acciones significativas.

---

# 33. Idempotencia

Donde un evento derive de una acción con sourceKey/idempotency existente, reutilizar esa identidad si hace falta.

No duplicar analytics por retry.

---

# 34. API analytics

Crear endpoints solo para Admin.

Ejemplo:

```text
GET /api/admin/analytics?range=30d
GET /api/admin/observability/errors
PATCH /api/admin/observability/errors/[id]
```

Adaptar a patrones existentes.

Todos:
- server auth;
- ADMIN o permiso equivalente;
- DTO mínimo;
- límites.

---

# 35. Performance

Analytics no debe degradar las acciones principales.

Preferir:

- escritura pequeña;
- no consultas pesadas en cada request;
- agregaciones optimizadas;
- índices por `type`, `createdAt`, `userId` cuando corresponda;
- consultas agrupadas;
- `Promise.all` para dashboard;
- caché corta si ya existe patrón seguro.

No crear background queue nueva.

---

# 36. Prisma

Cambios probables:

```text
AnalyticsEvent
ApplicationError
```

Enums relacionados.

Solo si hacen falta.

Una sola migración v0.11.

Debe ser:
- aditiva;
- indexada;
- no destructiva;
- compatible.

No aplicar a Neon automáticamente.

---

# 37. Web Vitals

Opcional recomendado si puede hacerse sin dependencia pesada.

Capturar agregadamente:

- LCP
- CLS
- INP

No guardar:
- ruta con datos sensibles;
- user agent completo;
- IP.

Agrupar por área/ruta pública segura.

Si complica demasiado la release, priorizar observabilidad server-side.

---

# 38. Alertas visuales

En Admin, marcar estados simples:

```text
Normal
Atención
Crítico
```

solo si se pueden definir thresholds razonables.

No generar alertas falsas.

No enviar emails/slack en v0.11.

---

# 39. Export

NO crear CSV/export masivo por defecto.

Si ya hay helper simple para pequeñas métricas agregadas, opcional.

No exportar eventos raw con datos de usuario.

---

# 40. ES/EN

Todo nuevo:
- ES;
- EN.

No hardcodear:
- métricas;
- estados;
- filtros;
- tooltips;
- errores;
- labels de charts.

---

# 41. Responsive

Validar:

- 390px;
- 768px;
- 1366px;
- 1920px.

En mobile:
- KPIs apilados;
- charts legibles;
- tablas/listas adaptables;
- sin overflow horizontal accidental.

---

# 42. Accesibilidad

Charts deben tener:
- resumen textual;
- labels;
- no depender solo de color.

Además:
- teclado;
- focus;
- headings correctos;
- aria-label donde corresponda.

---

# 43. Seguridad

Solo Admin autorizado puede acceder a analytics detallado.

No exponer:
- raw user-level tracking;
- emails;
- tokens;
- IPs;
- private messages;
- moderation private notes.

No crear endpoint público de analytics internos.

---

# 44. Tests críticos

## Analytics
- event allowlist;
- significant activity definition;
- no duplicate event on idempotent retry;
- range aggregation 7/30/90;
- baseline zero handled.

## Economy
- coin metrics derive correctly;
- cosmetic purchase stats correct.

## Privacy
- no sensitive content in event metadata;
- non-admin denied;
- DTO does not expose user content.

## Errors
- duplicate errors aggregate by fingerprint;
- count/lastSeen update;
- ADMIN can resolve/ignore;
- non-admin denied.

## Regression
- tracked actions still succeed if analytics recording fails safely where appropriate;
- existing admin/dashboard remains functional.

---

# 45. Failure isolation

Analytics should never corrupt a successful business action.

For non-critical analytics writes:

```text
business action succeeds
analytics write fails
→ log technical failure
→ do not rollback valid user action
```

Exception:
- metrics derived transactionally from existing tables need no extra write.

Observability must not become a new source of outages.

---

# 46. Compatibilidad

No romper:

- auth/OAuth/2FA;
- profiles/social;
- chat/DMs;
- Team;
- CMS/wiki;
- progression/achievements;
- economy;
- cosmetics/Premium;
- creators;
- moderation;
- Admin Platform.

---

# 47. Criterios de aceptación

v0.11 está completa cuando:

1. `/admin/analytics` existe;
2. muestra métricas útiles de 7/30/90 días;
3. actividad real se define correctamente;
4. métricas derivables reutilizan tablas existentes;
5. tracking nuevo es server-side cuando corresponde;
6. no se almacena contenido sensible;
7. errores se agregan/fingerprint;
8. health summary existe;
9. admin puede revisar/resolver errores agregados;
10. analytics no rompe acciones si falla;
11. dashboard v0.10 muestra resumen mínimo;
12. ES/EN completo;
13. mobile funciona;
14. tests pasan;
15. typecheck/lint/build pasan;
16. migración queda generada y NO aplicada;
17. no se añadió vendor externo;
18. no se adelantó v0.12/v0.13.

---

# 48. Validación final

Ejecutar UNA sola vez:

```bash
npm run db:generate
npm run typecheck
npm test
npm run test:integration
npm run lint
npm run build
git diff --check
```

Corregir únicamente errores causados por esta release.

No repetir validaciones caras innecesariamente.

---

# 49. Git

No:
- commit;
- push;
- force push.

---

# 50. Reporte final

Responder solo con:

## Implemented
## Analytics model
## Activity definition
## Admin analytics
## Module metrics
## Funnels
## Error observability
## Health summary
## Privacy / security
## Retention
## Database changes
## Validation performed
## Known limitations
## Manual steps required
## Files of special importance

Máximo pocas líneas por sección.

---

# 51. Límite de complejidad

Si aparece una idea de:

- external analytics vendor;
- APM completo;
- distributed tracing;
- session replay;
- heatmaps;
- BI;
- data warehouse;
- event streaming;
- queues;
- advanced alerting;
- marketing attribution;
- user-level surveillance;

NO implementarla.

v0.11 es **medición interna útil + observabilidad ligera**.

---

# 52. Resultado esperado

TFLives debe terminar v0.11 con este ciclo:

```text
Usuarios usan TFLives
        ↓
acciones significativas se miden
        ↓
datos existentes se agregan
        ↓
Admin entiende uso y crecimiento
        ↓
errores se agrupan y se detectan
        ↓
el equipo puede decidir qué mejorar
```

Todo sin sacrificar privacidad ni introducir infraestructura innecesaria.
