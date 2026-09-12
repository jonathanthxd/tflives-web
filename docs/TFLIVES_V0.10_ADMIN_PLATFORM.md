# TFLives Web — v0.10.0 Admin Platform
## Directiva compacta para Codex — GPT-5.6 Terra Extra High (Standard)

**Repositorio:** `C:\Users\Administrator\Desktop\web-tflives`  
**Branch:** `main`  
**Release:** `v0.10.0 — Admin Platform`  
**Prioridad:** convertir `/admin` en una plataforma administrativa coherente, rápida y segura sin reimplementar los módulos ya funcionales  
**Estado base:** v0.9 Creator Ecosystem funcional + perfiles + progresión + economía + cosméticos + Premium + contenido + Team + moderación  
**Stack obligatorio:** Next.js App Router + TypeScript + Prisma + Neon PostgreSQL + Better Auth + Vercel + next-intl

---

# 1. Objetivo

TFLives ya tiene muchas herramientas administrativas, pero fueron creciendo por módulos.

v0.10 debe convertirlas en una **plataforma administrativa unificada**.

El objetivo NO es rehacer cada herramienta. Es crear una experiencia central desde la cual Staff autorizado pueda:

- entender el estado general de TFLives;
- encontrar usuarios y recursos rápidamente;
- navegar todos los módulos administrativos;
- ejecutar acciones comunes;
- revisar actividad administrativa;
- ver alertas/pendientes;
- acceder a cada herramienta existente con contexto;
- trabajar correctamente en desktop y tablet/mobile.

La experiencia debe sentirse como un producto interno real, no como una colección de rutas `/admin/*`.

---

# 2. Regla de eficiencia

Haz UNA auditoría dirigida únicamente de:

- layout/shell actual de `/admin`;
- navegación administrativa;
- roles/permisos existentes;
- AdminActionLog/audit log;
- usuarios/perfiles;
- moderación/reportes;
- editorial/CMS/wiki;
- Team;
- achievements;
- economy;
- cosmetics/Premium;
- creators;
- notification patterns;
- APIs administrativas existentes;
- tests administrativos relevantes.

Después implementa directamente.

NO:

- auditoría global del repositorio;
- reescritura de módulos funcionales;
- refactor masivo;
- nueva librería de dashboard;
- analytics avanzados;
- observability;
- monitorización de infraestructura;
- integraciones externas nuevas.

---

# 3. Principio de producto

El Admin debe funcionar como un **centro operativo**.

Debe responder rápidamente:

```text
¿Qué necesita atención?
¿Quién es este usuario?
¿Qué pasó recientemente?
¿Dónde gestiono esta función?
¿Qué puedo hacer con mi rol?
```

y permitir llegar a la herramienta correcta en pocos clics.

---

# 4. Alcance obligatorio

Implementar:

1. Admin Shell unificado;
2. dashboard principal `/admin`;
3. navegación agrupada;
4. permisos visibles por rol;
5. buscador global administrativo;
6. página de usuario administrativa mejorada;
7. bandeja de pendientes;
8. actividad/auditoría reciente;
9. quick actions seguras;
10. enlaces/contexto entre módulos;
11. estados vacíos/carga/error coherentes;
12. experiencia responsive;
13. ES/EN;
14. tests críticos;
15. build final.

Migración Prisma solo si es realmente necesaria.

---

# 5. Fuera de alcance

NO implementar:

- v0.11 Analytics & Observability;
- dashboards históricos complejos;
- gráficos financieros;
- tracking de funnels;
- logs de servidor/VPS;
- health checks de infraestructura;
- Sentry;
- OpenTelemetry;
- Grafana;
- métricas de Vercel;
- nueva plataforma de permisos completa;
- impersonation/login-as-user;
- SQL console;
- terminal;
- file manager;
- bulk destructive actions masivas;
- automations/workflows complejos.

---

# 6. Admin Shell

Crear/refinar un shell consistente para todas las rutas administrativas.

Debe incluir:

- sidebar/navigation;
- header;
- título/contexto;
- breadcrumbs simples;
- user/admin menu;
- estado activo de sección;
- acceso rápido al sitio público;
- mobile drawer;
- ancho/espaciado coherente.

Reutilizar componentes existentes cuando sea posible.

No crear un segundo design system.

---

# 7. Navegación administrativa

Agrupar módulos por intención.

Propuesta:

```text
Resumen
- Dashboard

Comunidad
- Usuarios
- Moderación
- Creadores
- Team

Contenido
- Editorial / CMS
- Wiki
- Timeline / trayectoria
- Feed / anuncios si ya existen

Progresión
- Logros
- Economía
- Cosméticos
- Premium

Sistema
- Auditoría
- Configuración administrativa existente
```

Adaptar a las rutas reales.

No mostrar enlaces a módulos inexistentes.

---

# 8. Navegación según permisos

La navegación debe respetar permisos/roles reales.

Un usuario no debe ver como disponible una herramienta que no puede usar.

Pero la seguridad final sigue siendo server-side.

Ocultar un link NO reemplaza autorización.

No inventar permisos client-side.

---

# 9. Dashboard `/admin`

Crear un resumen operativo compacto.

Debe mostrar conteos/estado actual de cosas que ya existen, por ejemplo:

- usuarios;
- solicitudes de creator pendientes;
- reportes/moderación pendientes;
- contenido programado/pendiente si existe;
- creadores activos;
- cosméticos activos;
- Premium activos;
- eventos administrativos recientes.

Mantenerlo pequeño.

No convertirlo en v0.11 Analytics.

---

# 10. Pendientes

Crear una sección/widget “Necesita atención”.

Puede agregar únicamente recursos reales existentes:

```text
Solicitudes de creator pendientes
Reportes abiertos
Apelaciones pendientes
Contenido pendiente/programado relevante
Otros estados administrativos reales
```

Cada item debe enlazar directamente a la herramienta correspondiente.

No inventar un sistema de tareas separado.

---

# 11. Buscador global administrativo

Añadir búsqueda desde el shell/admin header.

Debe poder encontrar inicialmente:

- usuarios por nombre/@/email cuando el rol tenga permiso;
- creators;
- Team members;
- achievements;
- cosmetics;
- contenido editorial/wiki si ya existe una búsqueda sencilla reutilizable.

No es necesario indexar todo.

Preferir búsqueda server-side limitada y rápida.

---

# 12. Privacidad del buscador

Datos sensibles:

- email;
- roles internos;
- estados administrativos;

solo deben aparecer a roles autorizados.

La respuesta de búsqueda debe ser un DTO mínimo.

No exponer objetos Prisma completos.

---

# 13. UX del buscador

Experiencia:

```text
Buscar en administración…
```

Resultados agrupados:

```text
Usuarios
Creadores
Contenido
Cosméticos
Logros
```

Cada resultado:
- icono/tipo;
- nombre;
- detalle corto;
- CTA/navegación.

Debe funcionar con teclado.

Si es barato:
- `/` o `Ctrl/Cmd + K` puede enfocar/abrir búsqueda.

No añadir dependencia pesada de command palette.

---

# 14. Administración de usuarios

Mejorar la experiencia administrativa de usuario existente o crear una vista unificada si actualmente está fragmentada.

Página tipo:

```text
/admin/usuarios/[username|id]
```

Debe resumir:

- identidad;
- @username;
- email solo si autorizado;
- roles;
- estado cuenta;
- fecha de alta;
- seguridad básica disponible;
- progreso/nivel;
- balance TFL Coins;
- Premium;
- creator status;
- cosméticos relevantes;
- moderación relevante;
- actividad administrativa asociada.

No debe permitir editar todo directamente.

Debe enlazar a los módulos especialistas.

---

# 15. Acciones de usuario

Solo incluir acciones que YA tengan servicios/authorization seguros.

Ejemplos:

- abrir perfil público;
- abrir economía;
- abrir Premium;
- abrir moderación;
- abrir creator;
- abrir auditoría relacionada.

No duplicar servicios sensibles.

No crear “ban”, “delete user”, “reset password” improvisados si no existen de forma segura.

---

# 16. Quick Actions

Dashboard puede ofrecer acciones frecuentes:

```text
Buscar usuario
Revisar reportes
Revisar creators
Crear anuncio/contenido
Crear logro
Crear cosmético
Ajustar TFL Coins
```

Solo si esas rutas/acciones existen.

Preferir links contextualizados a duplicar formularios.

---

# 17. Audit log

Crear/refinar una vista administrativa útil sobre el audit log existente.

Debe permitir:

- actividad reciente;
- actor;
- acción;
- objetivo;
- fecha/hora;
- filtro simple por actor/tipo;
- detalle seguro.

No permitir editar/borrar audit logs desde UI.

---

# 18. Timeline administrativa

En dashboard, mostrar las últimas acciones relevantes como feed corto.

Ejemplo:

```text
Jonathan otorgó Premium a @usuario
Cebas aprobó a @creator
Jonathan creó el cosmético Aurora
...
```

Debe derivarse del audit log existente.

No duplicar eventos en otra tabla.

---

# 19. Cross-linking

Los módulos deben conectarse mejor.

Ejemplos:

Desde Creator:
- abrir User admin detail.

Desde User:
- abrir Creator.
- abrir Economy.
- abrir Premium.
- abrir perfil público.

Desde Cosmetic:
- abrir catálogo público.

Desde Achievement:
- abrir vista pública/relacionada si aplica.

No convertir cada página en un mega-dashboard.

---

# 20. Breadcrumbs / contexto

Usar breadcrumbs simples:

```text
Admin / Creadores / @usuario
Admin / Cosméticos / Aurora
```

No requerir breadcrumbs complejos generados dinámicamente si no aportan valor.

---

# 21. Estados UI compartidos

Unificar patrones para:

- loading;
- skeleton;
- empty;
- error;
- unauthorized;
- success feedback;
- destructive confirmation.

Reutilizar componentes existentes o crear pequeños primitives internos.

No reescribir todos los formularios.

---

# 22. Confirmaciones

Acciones destructivas/sensibles deben usar confirmación clara.

Mostrar:
- objetivo;
- efecto;
- si es reversible o no.

No usar confirmación para acciones triviales.

---

# 23. Feedback administrativo

Después de una acción:

- toast o feedback existente;
- estado actualizado;
- error humano si falla;
- no mostrar stack traces.

Mantener detalles técnicos solo en logs/servidor.

---

# 24. Roles

Reutilizar roles existentes.

No crear una arquitectura RBAC nueva si no es imprescindible.

Como mínimo respetar:

- ADMIN;
- MODERATOR/MOD si existe;
- roles superiores existentes.

Si una ruta ya requiere ADMIN:
- mantenerlo.

Si Moderación permite MOD:
- mantenerlo.

No ampliar permisos accidentalmente.

---

# 25. Authorization central

No confiar en:

- sidebar;
- botón oculto;
- query param;
- role enviado por cliente.

Cada API/action administrativa debe seguir verificando autorización server-side.

Si se detecta una ruta admin actual sin control adecuado dentro del alcance auditado, corregirla.

No hacer security audit completo del repo.

---

# 26. Datos del dashboard

Preferir un servicio agregador:

```text
getAdminDashboardSummary(...)
```

que consulte conteos pequeños en paralelo.

Evitar que el cliente llame 12 endpoints independientes.

No cargar listas completas para obtener counts.

---

# 27. Performance

- `Promise.all` cuando sea apropiado;
- `count()` en BD;
- límites en activity/audit;
- paginación;
- debounce en search;
- evitar N+1;
- DTO mínimo;
- no cargar imágenes grandes.

El Admin debe sentirse rápido.

---

# 28. Responsive

Admin debe ser funcional en:

- 390px;
- 768px;
- 1366px;
- 1920px.

En móvil:
- sidebar como drawer;
- tablas pueden convertirse en cards/listas o scroll controlado;
- acciones importantes accesibles;
- no ocultar funcionalidad esencial.

---

# 29. Tablas

No hacer tablas enormes por defecto.

Para listas densas:
- desktop: tabla si aporta valor;
- móvil: layout adaptable.

Añadir:
- paginación;
- búsqueda/filtro cuando ya sea necesario.

No implementar data-grid enterprise.

---

# 30. Diseño

Mantener identidad TFLives:

- dark/light;
- glass/material existente;
- azul/violeta;
- tipografía actual;
- cards coherentes.

Admin puede ser un poco más denso que el sitio público.

Evitar:
- dashboards SaaS genéricos;
- exceso de gradientes;
- cards dentro de cards dentro de cards;
- enormes espacios vacíos.

---

# 31. i18n

Todo nuevo:
- ES;
- EN.

No hardcodear:
- nombres de secciones;
- estados;
- placeholders;
- acciones;
- errores;
- breadcrumbs visibles.

---

# 32. Accesibilidad

- navegación por teclado;
- focus visible;
- labels;
- landmarks;
- drawer accesible;
- search accesible;
- botones icon-only con aria-label;
- contraste.

---

# 33. Prisma

No asumir que v0.10 necesita migración.

Preferir reutilizar:
- User;
- AdminActionLog;
- Creator;
- Economy;
- Cosmetics;
- Achievements;
- Content;
- Moderation.

Si una necesidad pequeña requiere persistencia:
- una sola migración aditiva;
- justificarla;
- no aplicar a Neon.

No crear tablas solo para el dashboard.

---

# 34. APIs

Crear únicamente endpoints agregadores/search que hagan falta.

Ejemplos posibles:

```text
GET /api/admin/dashboard
GET /api/admin/search?q=
GET /api/admin/users/[id]/overview
GET /api/admin/audit
```

Adaptar a patrones existentes.

Todos protegidos.

---

# 35. Buscador — límites

Aplicar:

- query mínima razonable;
- `limit`;
- debounce;
- escape/normalización;
- autorización;
- no full-table payload.

No implementar Elasticsearch/Meilisearch.

---

# 36. Tests críticos

## Authorization
- non-staff rejected;
- MOD accesses only routes already allowed;
- ADMIN accesses admin platform;
- hidden nav never substitutes server auth.

## Dashboard
- summary returns expected safe counts;
- private data not leaked.

## Search
- minimum query;
- correct grouped results;
- unauthorized denied;
- email visibility restricted appropriately.

## User overview
- correct cross-module summary;
- sensitive fields role-protected.

## Audit
- recent entries readable;
- immutable through UI/API.

## Regression
- existing admin module routes continue working.

---

# 37. Compatibilidad

No romper:

- auth/OAuth/2FA;
- public profiles;
- follows/likes;
- chat/DMs;
- Team;
- CMS/wiki;
- progression;
- achievements;
- TFL Coins;
- cosmetics;
- Premium;
- creators;
- notifications;
- moderation.

---

# 38. Criterios de aceptación

v0.10 está completa cuando:

1. `/admin` es un dashboard útil;
2. existe shell/navegación unificada;
3. navegación respeta permisos;
4. pendientes reales son visibles;
5. búsqueda administrativa funciona;
6. user admin overview centraliza contexto;
7. audit log es fácil de consultar;
8. módulos existentes siguen siendo especialistas;
9. existe cross-linking entre módulos;
10. estados loading/empty/error son coherentes;
11. Admin funciona bien en mobile/tablet;
12. authorization sigue server-side;
13. ES/EN completo;
14. tests pasan;
15. typecheck/lint/build pasan;
16. no se adelantó v0.11;
17. no se añadieron dependencias pesadas innecesarias;
18. no se aplicó ninguna migración automáticamente.

---

# 39. Validación final

Ejecutar UNA sola vez al final:

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

No repetir builds/test suites caros innecesariamente.

---

# 40. Git

No:

- commit;
- push;
- force push.

---

# 41. Reporte final

Responder solo con:

## Implemented
## Admin shell
## Dashboard
## Navigation / permissions
## Global search
## User administration
## Pending work
## Audit activity
## Cross-module integration
## Security
## Database changes
## Validation performed
## Known limitations
## Manual steps required
## Files of special importance

Máximo pocas líneas por sección.

---

# 42. Límite de complejidad

Si aparece una idea de:

- analytics históricos;
- charts avanzados;
- observability;
- infrastructure monitoring;
- custom RBAC builder;
- workflow automation;
- impersonation;
- SQL console;
- bulk destructive operations;
- external BI;

NO implementarla.

Eso pertenece a otras releases o queda fuera de producto.

---

# 43. Resultado esperado

TFLives v0.10 debe terminar con este flujo operativo:

```text
Staff entra a /admin
        ↓
ve lo que necesita atención
        ↓
busca usuario/recurso
        ↓
entiende rápidamente su contexto
        ↓
entra al módulo especializado
        ↓
realiza la acción autorizada
        ↓
queda registrada en auditoría
```

El resultado debe ser una **plataforma administrativa coherente**, no una reimplementación de todo lo que ya funciona.
