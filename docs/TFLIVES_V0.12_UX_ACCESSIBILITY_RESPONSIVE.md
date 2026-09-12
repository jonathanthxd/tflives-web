# TFLives Web — v0.12.0 UX, Accessibility & Responsive
## Directiva compacta para Codex — GPT-5.6 Terra Extra High (Standard)

**Repositorio:** `C:\Users\Administrator\Desktop\web-tflives`  
**Branch:** `main`  
**Release:** `v0.12.0 — UX, Accessibility & Responsive`  
**Prioridad:** hacer que toda la plataforma se sienta coherente, fácil de usar y sólida en móvil/desktop sin introducir grandes sistemas nuevos  
**Estado base:** v0.11 Analytics & Observability funcional + rework visual de Analytics + Admin Platform + perfiles sociales + progresión + economía + cosméticos + Premium + creators + moderación  
**Stack obligatorio:** Next.js App Router + TypeScript + Prisma + Neon PostgreSQL + Better Auth + Vercel + next-intl

---

# 1. Objetivo

v0.12 es el gran pase transversal de experiencia de usuario.

No debe añadir otro sistema grande.

Debe tomar todo lo construido entre v0.1 y v0.11 y hacer que se sienta como **un solo producto terminado**.

El objetivo es mejorar de extremo a extremo:

- claridad;
- consistencia visual;
- navegación;
- formularios;
- estados vacíos;
- feedback;
- responsive;
- accesibilidad;
- teclado;
- focus;
- touch targets;
- mobile UX;
- densidad;
- jerarquía;
- loading;
- errores;
- confirmaciones;
- microcopy;
- componentes repetidos.

---

# 2. Regla de eficiencia

Haz UNA auditoría UX dirigida y sistemática.

No audites internals técnicos que no afecten UX.

Revisar prioritariamente:

- shell público;
- navbar/header;
- footer;
- home;
- network;
- perfiles;
- friends/follows/likes;
- chat global;
- DMs;
- settings;
- progression;
- achievements;
- TFL Coins;
- cosmetics/inventory;
- Premium;
- creators/streamers;
- Team;
- CMS/wiki;
- admin shell/dashboard;
- admin analytics;
- moderation;
- auth/login/register;
- formularios y modales;
- estados loading/empty/error;
- mobile layouts.

Después implementa directamente.

No entregar un informe de 100 problemas antes de trabajar.

---

# 3. Principio de producto

La plataforma debe sentirse:

```text
clara
predecible
rápida de entender
cómoda en móvil
consistente
accesible
con personalidad TFLives
```

No debe sentirse:

```text
como módulos pegados
como dashboard SaaS genérico
como interfaz de desarrolladores
como páginas desktop comprimidas en móvil
```

---

# 4. Alcance obligatorio

Implementar:

1. auditoría UX transversal;
2. responsive real en rutas principales;
3. navegación móvil refinada;
4. jerarquía visual consistente;
5. espaciado/densidad consistente;
6. tamaños táctiles correctos;
7. formularios consistentes;
8. feedback de acciones;
9. estados vacíos con personalidad;
10. loading/skeleton coherente;
11. errores comprensibles;
12. focus/keyboard;
13. accesibilidad básica WCAG práctica;
14. tablas/listas móviles;
15. modales/drawers adaptables;
16. mejoras en perfiles/chat/settings/admin;
17. ES/EN;
18. tests/regression esenciales;
19. build final.

Evitar migraciones Prisma.

---

# 5. Fuera de alcance

NO implementar:

- features grandes nuevas;
- nueva economía;
- nuevos cosméticos;
- nuevos sistemas sociales;
- nuevos roles;
- nueva arquitectura auth;
- analytics nuevos;
- SEO profundo;
- performance profiling profundo;
- legal/privacy rewrite;
- infrastructure hardening;
- PWA completa;
- app móvil nativa;
- redesign total de marca.

Esos temas pertenecen a otras releases.

---

# 6. Breakpoints de referencia

Validar como mínimo:

```text
390px
768px
1024px
1366px
1920px
```

No diseñar solo para 1366px.

---

# 7. Mobile-first real

En móvil:

- navegación usable con una mano;
- drawers/modals no deben desbordar;
- formularios no deben quedar comprimidos;
- tablas deben adaptarse;
- acciones principales visibles;
- botones con tamaño táctil suficiente;
- no depender de hover;
- menus contextuales accesibles por tap;
- scroll interno solo donde realmente ayuda.

---

# 8. Navbar / navegación pública

Auditar:

- logo;
- links;
- menú de usuario;
- TFL Coins si se muestra;
- notificaciones;
- acceso a chat;
- mobile menu;
- active state.

Reducir saturación.

Asegurar que los elementos frecuentes tengan prioridad.

---

# 9. Footer

Mantenerlo compacto.

Revisar:

- espacios vacíos;
- separación;
- legibilidad;
- links legales;
- mobile wrapping.

No volver a hacerlo enorme.

---

# 10. Home

Revisar:

- hero;
- jerarquía;
- CTAs;
- secciones;
- cards;
- espacio vertical;
- mobile order.

No rediseñar branding.

Eliminar contenido que se sienta redundante o demasiado denso.

---

# 11. Perfiles

Preservar el rework actual.

Auditar:

- header;
- avatar/banner;
- follow/like/actions;
- amigos/seguidores;
- TFL Coins;
- creator badge;
- cosmetics;
- bio;
- actividad reciente;
- progression;
- achievements con scroll;
- mobile stacking.

No volver a unir Bio y Actividad reciente.

Mantenerlas como cards separadas.

---

# 12. Chat global

Auditar:

- tamaño del widget;
- móvil;
- input;
- reply;
- reactions;
- emoji/stickers;
- estados vacíos;
- mensajes largos;
- touch;
- scroll;
- focus.

No cambiar la lógica funcional si ya funciona.

---

# 13. DMs

Auditar:

- lista conversaciones;
- conversación activa;
- mobile navigation;
- edit/delete;
- reply;
- timestamps;
- empty state;
- long messages;
- keyboard.

Editar sigue limitado a 15 minutos.

Eliminar sigue funcionando como actualmente.

---

# 14. Settings

Revisar arquitectura de:

- Perfil;
- Seguridad;
- Privacidad;
- Notificaciones;
- TFL Coins;
- otras secciones existentes.

Objetivo:

- navegación clara;
- no demasiadas cards gigantes;
- formularios escaneables;
- separación entre categorías;
- mobile usable.

---

# 15. Economía / wallet

Mantener detalle en Settings.

Mejorar:

- lectura de balance;
- historial;
- créditos/débitos;
- empty state;
- labels;
- mobile.

No convertirlo en banca/crypto.

---

# 16. Cosmetics

Auditar:

- catálogo;
- filtros;
- inventario;
- balance;
- owned/equipped;
- premium lock;
- preview;
- mobile grid.

Evitar cards demasiado altas o repetitivas.

---

# 17. Creators / Streamers

Auditar:

- directory;
- search/filter;
- featured;
- creator cards;
- detail page;
- application form;
- mobile.

Debe sentirse como discovery, no como tabla.

---

# 18. Team

Mantener identidad ligada a usuarios reales.

Revisar:

- avatar;
- nombre;
- @username;
- rol;
- click al perfil;
- responsive.

---

# 19. Admin

Preservar v0.10.

Auditar:

- sidebar;
- mobile drawer;
- breadcrumbs;
- global search;
- dashboard;
- tables;
- forms;
- user overview;
- analytics;
- moderation.

Admin puede ser más denso, pero no incómodo.

---

# 20. Analytics

Preservar rework visual v0.11.

Auditar:

- jerarquía;
- visual cards;
- charts/visual resources;
- filtros 7/30/90;
- mobile;
- labels.

No introducir nuevas métricas.

---

# 21. Formularios

Unificar:

- labels;
- help text;
- required/optional;
- validation;
- error messages;
- disabled;
- loading;
- success.

Inputs deben tener:

- altura consistente;
- focus visible;
- buen contraste;
- autocomplete correcto cuando aplique;
- labels reales.

---

# 22. Botones

Unificar variantes reales:

```text
primary
secondary
ghost
danger
icon
```

No crear 20 estilos locales.

Revisar:

- tamaños;
- estados disabled;
- loading;
- icon alignment;
- touch target.

---

# 23. Touch targets

Objetivo práctico:

- controles táctiles alrededor de 44px cuando sea posible;
- icon buttons no diminutos;
- suficiente separación entre acciones destructivas y normales.

No sacrificar densidad desktop innecesariamente.

---

# 24. Focus

Todo control interactivo debe mostrar focus visible por teclado.

No eliminar outline sin reemplazo.

Revisar:

- buttons;
- links;
- inputs;
- cards clicables;
- menus;
- drawers;
- modals;
- tabs;
- search.

---

# 25. Keyboard

Validar:

- Tab;
- Shift+Tab;
- Enter;
- Escape;
- Space cuando corresponde;
- arrow keys en patrones que ya las soporten.

No construir complejos shortcuts nuevos.

---

# 26. Modales y drawers

Deben:

- atrapar focus cuando corresponda;
- cerrar con Escape;
- tener botón cerrar accesible;
- no dejar background interactuable si son modal;
- adaptarse a móvil;
- no sobrepasar viewport.

Preferir drawer/bottom sheet en móvil cuando la UI actual ya lo permita sin refactor grande.

---

# 27. Contraste

Revisar especialmente:

- muted text;
- badges;
- borders;
- disabled;
- placeholders;
- rareza de cosmetics;
- charts;
- light theme.

No depender solo del color para comunicar estado.

---

# 28. Tipografía

Auditar:

- tamaños demasiado pequeños;
- line-height;
- headings;
- subtitles;
- labels;
- metadata.

No reducir texto para “hacer caber” contenido.

Mantener una jerarquía consistente.

---

# 29. Espaciado

Reducir inconsistencias como:

- cards con demasiado aire;
- secciones pegadas;
- paddings diferentes sin razón;
- enormes márgenes verticales;
- layouts vacíos.

Usar escala existente.

No rediseñar Tailwind config completo.

---

# 30. Cards

Evitar:

```text
card
  card
    card
      card
```

Usar agrupación por superficie y divisores cuando sea más claro.

Preservar cards separadas cuando representan conceptos distintos.

---

# 31. Empty states

Cada empty state debe responder:

```text
¿Qué está vacío?
¿Por qué?
¿Qué puedo hacer?
```

Agregar personalidad TFLives sin exagerar.

Ejemplos:

- “Por aquí todo está tranquilo.”
- “Aún no tienes cosméticos.”
- “Todavía no hay movimientos.”
- “No encontramos creadores con esos filtros.”

No usar textos robóticos como único feedback.

---

# 32. Loading

Crear/reutilizar patrones coherentes:

- skeleton;
- spinner pequeño;
- button loading;
- page loading.

Evitar layout shift grande.

No mostrar skeleton donde una transición instantánea es suficiente.

---

# 33. Errors

Errores visibles al usuario deben ser humanos.

Ejemplo:

```text
No pudimos guardar el cambio. Inténtalo otra vez.
```

No:

```text
P2002 Prisma error
```

Mantener error técnico en server logs/observability.

---

# 34. Toasts / feedback

Acciones exitosas deben dar feedback cuando no sea evidente.

Evitar toast spam.

No usar toast para cada navegación normal.

---

# 35. Confirmaciones destructivas

Acciones como:

- eliminar;
- revocar;
- bloquear;
- rechazar;
- borrar contenido;

deben explicar el efecto.

No usar `window.confirm` si ya existe un patrón UI mejor.

---

# 36. Tablas / listas

En desktop:
- tabla si realmente ayuda.

En mobile:
- card/list;
- columnas prioritarias;
- horizontal scroll solo si es la opción más clara.

No esconder acciones esenciales.

---

# 37. Search / filters

Unificar comportamiento:

- debounce;
- clear;
- empty;
- loading;
- count;
- mobile wrapping.

No crear UI distinta para cada módulo sin razón.

---

# 38. Accessibility semantics

Revisar:

- `main`;
- `nav`;
- headings;
- `button` vs `div`;
- links;
- form labels;
- lists;
- aria-labels;
- dialog semantics.

No añadir ARIA innecesario cuando HTML semántico ya resuelve el problema.

---

# 39. Images

Revisar:

- alt;
- avatar fallback;
- aspect ratio;
- crop;
- layout shifts.

No cambiar todo a `next/image` solo para eliminar warnings si no aporta beneficio real en esta release.

---

# 40. Reduced motion

IMPORTANTE:

No desactivar ni reducir automáticamente animaciones basándose en `prefers-reduced-motion`.

El producto actualmente mantiene sus efectos visuales independientemente de esa preferencia y se debe preservar esta decisión.

Aun así:
- evitar animaciones agresivas;
- evitar flashes;
- evitar transiciones que bloqueen interacción.

---

# 41. Light / Dark

Validar ambas apariencias.

Especial atención:

- backgrounds;
- glass;
- borders;
- charts;
- overlays;
- dropdowns;
- badges;
- inputs.

No diseñar solo en dark.

---

# 42. Localization

Validar ES/EN visualmente.

Inglés puede ser más corto/largo.

Evitar layouts dependientes de una longitud exacta de texto.

No hardcodear nuevos textos.

---

# 43. Accessibility targets

No intentar certificación WCAG formal.

Objetivo práctico:

- WCAG 2.2 AA cuando sea razonable;
- navegación keyboard usable;
- contraste suficiente;
- focus visible;
- formularios etiquetados;
- dialogs accesibles;
- touch targets correctos.

---

# 44. Component reuse

Cuando encuentres 3+ implementaciones casi iguales:

- consolidar en componente pequeño compartido si reduce inconsistencia.

No hacer refactor masivo del design system.

---

# 45. Dependencies

No añadir una librería UI nueva grande.

No cambiar framework CSS.

No introducir Material UI/Chakra/etc.

Reutilizar stack actual.

---

# 46. Prisma

v0.12 no debería necesitar migración.

Si surge una necesidad de BD para resolver UX:
- cuestionar primero si realmente pertenece a v0.12.

Preferir cero cambios de esquema.

---

# 47. Tests

Priorizar:

## Regression
- rutas principales renderizan;
- acciones principales siguen funcionando.

## Accessibility
Cuando sea barato:
- labels;
- interactive semantics;
- dialogs.

## Responsive logic
- componentes condicionales no pierden funcionalidad.

No intentar screenshot testing masivo si no existe infraestructura.

---

# 48. QA manual sugerido

Validar:

```text
/
network
perfil propio
perfil ajeno
streamers
cosmeticos
settings
mensajes
chat global
admin
admin/analytics
admin/users/[id]
```

en:

```text
390px
768px
1366px
1920px
```

y dark/light.

---

# 49. Compatibilidad

No romper:

- auth/OAuth/2FA;
- profiles;
- follows/likes;
- chat;
- DMs;
- Team;
- CMS/wiki;
- progression;
- achievements;
- economy;
- cosmetics;
- Premium;
- creators;
- moderation;
- admin;
- analytics/observability.

---

# 50. Criterios de aceptación

v0.12 está completa cuando:

1. mobile deja de sentirse secundario;
2. navegación pública/admin es consistente;
3. perfiles se ven bien en todos los breakpoints;
4. chat/DMs son cómodos en móvil;
5. settings son fáciles de recorrer;
6. formularios comparten comportamiento visual;
7. empty/loading/error states son consistentes;
8. focus/keyboard funcionan;
9. touch targets son adecuados;
10. light/dark son coherentes;
11. admin funciona en móvil/tablet;
12. analytics visual sigue claro;
13. no se rompieron features existentes;
14. ES/EN funcionan;
15. tests pasan;
16. typecheck/lint/build pasan;
17. no se creó migración innecesaria;
18. no se adelantó v0.13.

---

# 51. Validación final

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

Corregir problemas causados por esta release.

No repetir suites caras innecesariamente.

---

# 52. Git

No:

- commit;
- push;
- force push.

---

# 53. Reporte final

Responder solo con:

## Implemented
## Global UX
## Navigation
## Profiles
## Chat / DMs
## Settings
## Public modules
## Admin
## Responsive
## Accessibility
## Forms / feedback
## Visual consistency
## Database changes
## Validation performed
## Known limitations
## Manual QA recommended
## Files of special importance

Máximo pocas líneas por sección.

---

# 54. Límite de complejidad

Si aparece una idea de:

- nueva feature;
- nueva plataforma social;
- PWA;
- app móvil;
- nuevo design system;
- SEO profundo;
- image optimization global;
- caching overhaul;
- performance profiling;
- legal/privacy rewrite;

NO implementarla.

v0.12 es **pulido transversal de experiencia**.

---

# 55. Resultado esperado

TFLives debe terminar v0.12 con esta sensación:

```text
misma plataforma
mismas funciones
misma identidad
        ↓
pero mucho más clara
más consistente
más cómoda
más responsive
más accesible
más terminada
```

Esta release prepara el terreno para v0.13 Performance & SEO.
