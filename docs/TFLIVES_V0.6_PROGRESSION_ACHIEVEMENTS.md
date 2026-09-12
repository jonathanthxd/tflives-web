# TFLives Web — v0.6.0 Progression & Achievements
## Directiva compacta para Codex — GPT-5.6 Terra Extra High (Standard)

**Repositorio:** `C:\Users\Administrator\Desktop\web-tflives`  
**Branch:** `main`  
**Release:** `v0.6.0 — Progression & Achievements`  
**Prioridad:** núcleo funcional completo con mínimo consumo de contexto  
**Estado base:** v0.5 Profiles & Identity completada y funcional  
**Stack obligatorio:** Next.js App Router + TypeScript + Prisma + Neon PostgreSQL + Better Auth + Vercel + next-intl

---

# 1. Objetivo

Implementar una capa de progresión comunitaria reutilizable para TFLives:

- XP;
- niveles;
- barra/progreso al siguiente nivel;
- logros;
- desbloqueo automático de logros;
- historial/resumen de progreso;
- exposición de progreso en perfil;
- notificaciones por level-up/logro;
- protección anti-abuso básica.

Debe integrarse con los sistemas existentes sin reescribir auth, perfiles, chat, social ni administración.

Esta release NO incluye economía, monedas, tienda, cosméticos premium ni marketplace.

---

# 2. Regla de eficiencia

Trabaja en **un único pase cohesivo**.

Antes de editar:

1. lee este documento completo;
2. haz una auditoría breve y dirigida únicamente a:
   - Prisma `User/Profile`;
   - perfil público v0.5;
   - notificaciones;
   - chat/mensajes/amigos;
   - modelos/eventos ya existentes;
   - admin actual;
   - tests;
3. identifica puntos de integración;
4. implementa directamente.

No hagas un análisis general del repositorio.

No entregues un plan previo.

No investigues en web salvo una API/version instalada que sea imprescindible.

No refactorices módulos estables que no sean necesarios para v0.6.

---

# 3. Alcance obligatorio

Implementar:

1. modelo de progreso;
2. XP total;
3. nivel derivado o persistido de forma segura;
4. fórmula clara de nivel;
5. progreso al siguiente nivel;
6. catálogo de logros;
7. desbloqueo automático;
8. logros visibles en perfil;
9. resumen de nivel/XP en perfil;
10. notificación de nuevo nivel;
11. notificación de logro desbloqueado;
12. historial compacto de eventos de progreso si encaja limpiamente;
13. fuentes limitadas de XP;
14. límites anti-farming;
15. ES/EN;
16. tests;
17. migración Prisma aditiva;
18. build final.

---

# 4. Fuera de alcance

No implementar:

- TFL Coins;
- wallets;
- economía;
- tienda interna;
- marketplace;
- compras;
- premium;
- cosméticos;
- marcos de avatar;
- perfiles animados;
- battle pass;
- quests diarias;
- misiones complejas;
- leaderboards globales avanzados;
- temporadas;
- clanes;
- recompensas monetarias;
- Discord rewards;
- Minecraft rewards;
- presencia realtime;
- analytics avanzada;
- dashboard completo de achievements.

Esas funciones pertenecen a releases posteriores.

---

# 5. Modelo de progresión

Preferir un modelo simple y auditable.

Propuesta conceptual:

```text
UserProgress
- userId
- xp
- level
- updatedAt
```

Puede omitirse `level` si conviene derivarlo de `xp`, pero evita recalcular de forma ineficiente en todas partes.

No duplicar datos si ya existe una estructura equivalente.

---

# 6. Fórmula de niveles

Usar una fórmula creciente, simple y estable.

Objetivo:

- primeros niveles relativamente rápidos;
- progresión gradualmente más lenta;
- sin números absurdos;
- fácil de calcular tanto en server como UI.

Ejemplo aceptable:

```ts
xpRequiredForLevel(level) = 100 * level * level
```

o una fórmula equivalente mejor justificada.

Centralizarla en una utilidad única.

No dispersar fórmulas diferentes por frontend/backend.

Debe poder calcular:

- nivel actual;
- XP del nivel actual;
- XP requerido para siguiente;
- porcentaje de progreso.

---

# 7. Fuentes de XP

Mantener pocas fuentes reales y existentes.

Fuentes recomendadas:

- completar perfil por primera vez;
- enviar primer mensaje global;
- enviar primer DM;
- conseguir primer amigo;
- verificar email;
- vincular una cuenta OAuth;
- actividad comunitaria válida limitada.

No otorgar XP indiscriminadamente por cada request.

No añadir XP por:
- refresh;
- visitas repetidas;
- likes/reactions infinitos;
- acciones fáciles de automatizar sin límite.

---

# 8. XP por actividad repetible

Si se concede XP por acciones repetibles, aplicar límites server-side.

Ejemplos:

- mensaje global: XP solo para mensajes válidos, con cooldown/cap diario;
- DM: cap bajo;
- amistad: solo cuando la amistad se completa, no por spam de solicitudes.

No confiar en el cliente para otorgar XP.

No permitir endpoint público `addXp(amount)`.

---

# 9. Servicio central de progreso

Crear/reutilizar un servicio server-side central, por ejemplo:

```text
progressionService
```

Responsabilidades:

- otorgar XP;
- aplicar límites;
- calcular level-up;
- registrar evento;
- evaluar achievements;
- disparar notificación.

Toda fuente de XP debe pasar por este servicio.

Evitar duplicar lógica en cada endpoint.

---

# 10. Idempotencia

Eventos únicos no deben poder otorgarse varias veces.

Ejemplos:

- perfil completado;
- email verificado;
- primer amigo;
- primer mensaje;
- primera vinculación OAuth.

Usar estado/achievement/eventos existentes para prevenir duplicados.

No confiar solo en flags del cliente.

---

# 11. Logros

Crear un catálogo pequeño pero real para v0.6.

Objetivo: **8–12 logros**, no 50.

Ejemplos apropiados:

- `WELCOME` — completar identidad/perfil;
- `FIRST_MESSAGE` — primer mensaje global;
- `FIRST_FRIEND` — primera amistad;
- `FIRST_DM` — primer mensaje privado;
- `VERIFIED` — email verificado;
- `CONNECTED` — vincular proveedor social;
- `LEVEL_5`;
- `LEVEL_10`;
- `SOCIAL_5` — alcanzar 5 amistades;
- `PROFILE_COMPLETE`.

Ajustar nombres según datos realmente disponibles.

No crear logros imposibles de detectar con el sistema actual.

---

# 12. Modelo de achievements

Preferir catálogo definido de forma central + tabla de desbloqueos.

Propuesta conceptual:

```text
Achievement
- id/code
- category
- titleKey
- descriptionKey
- icon
- xpReward (opcional y controlado)

UserAchievement
- userId
- achievementCode
- unlockedAt
```

No es obligatorio persistir el catálogo si un catálogo tipado en código es más simple y estable.

Sí persistir desbloqueos por usuario.

No crear un CMS completo para achievements en esta release.

---

# 13. Recompensa de achievements

Los logros pueden otorgar XP adicional pequeño.

Evitar cadenas infinitas:

```text
achievement -> XP -> level achievement -> XP -> ...
```

El servicio debe poder resolverlo de forma segura y determinista.

No permitir loops recursivos.

---

# 14. Categorías

Mantener pocas:

- Comunidad
- Identidad
- Social
- Progreso

Traducir en ES/EN.

---

# 15. Perfil público

Integrar v0.6 dentro del perfil v0.5.

Mostrar:

- nivel;
- barra XP;
- XP actual / siguiente nivel;
- logros recientes o destacados;
- total de logros desbloqueados.

No rehacer el diseño del perfil.

No añadir estadísticas ficticias.

---

# 16. Página/sección de logros

Preferir una sección dentro del perfil o una ruta simple si ya encaja con la arquitectura.

Debe mostrar:

- desbloqueados;
- bloqueados;
- progreso cuando pueda calcularse limpiamente;
- descripción;
- fecha de desbloqueo.

No convertirlo en una app separada.

---

# 17. Privacidad

XP/nivel pueden ser públicos por defecto.

Los achievements pueden ser públicos como parte de la identidad comunitaria.

No exponer:

- logs internos anti-abuso;
- IP;
- metadata privada;
- información de seguridad.

Respetar bloqueos existentes.

---

# 18. Notificaciones

Reutilizar sistema de notificaciones existente.

Crear tipos solo si hacen falta, por ejemplo:

- `LEVEL_UP`;
- `ACHIEVEMENT_UNLOCKED`.

Mensajes localizados.

No enviar notificación por cada punto de XP.

Solo:
- level-up;
- achievement.

---

# 19. Activity/progress events

Si es útil para idempotencia/auditoría, crear un modelo compacto como:

```text
ProgressEvent
- id
- userId
- type
- xp
- sourceKey
- createdAt
```

`sourceKey` puede ser único cuando el evento sea one-time.

No guardar payloads enormes.

No construir analytics aquí.

---

# 20. Anti-abuso

Requisitos mínimos:

- XP otorgado solo server-side;
- caps/cooldowns para acciones repetibles;
- eventos únicos idempotentes;
- amount definido por servidor, nunca por cliente;
- transacciones Prisma cuando XP + achievement + event deban ser consistentes;
- evitar doble award por requests concurrentes cuando sea razonable.

No construir un anti-cheat complejo.

---

# 21. Integraciones

Integrar únicamente donde sea barato y seguro.

Prioridad:

1. perfil completo;
2. email verified si ya existe hook/evento confiable;
3. OAuth linked si ya existe hook/evento confiable;
4. primer mensaje global;
5. primer DM;
6. primera amistad;
7. level milestones.

Si una integración requiere reescribir un módulo grande, omitirla y documentar.

---

# 22. Admin

No crear dashboard completo.

Si el admin actual permite integración mínima y barata, opcionalmente mostrar:

- nivel;
- XP;
- achievements count.

No permitir edición manual de XP salvo que ya exista un patrón administrativo seguro.

No hacer herramientas de fraude/reversión todavía.

---

# 23. API

Crear endpoints solo cuando hagan falta para lectura.

Ejemplos:

```text
GET /api/profile/[username]/progress
GET /api/account/progress
```

No crear endpoint genérico para sumar XP.

Toda escritura ocurre como efecto server-side de acciones reales.

---

# 24. DTO

Crear DTO público mínimo:

```ts
type PublicProgress = {
  level: number;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  achievementCount: number;
};
```

No exponer internals anti-farming.

---

# 25. Prisma

Auditar antes de añadir.

Cambios razonables:

- `UserProgress`;
- `UserAchievement`;
- opcional `ProgressEvent`.

Usar nombres coherentes con schema actual.

Una sola migración v0.6.

Debe ser:

- aditiva;
- compatible con usuarios existentes;
- sin pérdida de datos;
- con índices;
- con relaciones/cascade razonables.

Usuarios existentes deben empezar con progreso válido sin migración manual compleja.

---

# 26. Migración

Generar:

```text
prisma/migrations/<timestamp>_progression_achievements/migration.sql
```

No aplicarla a Neon.

No usar:

- `prisma db push`;
- `prisma migrate reset`;
- DROP destructivo.

---

# 27. UX

Visualmente:

- integrar nivel en perfil sin dominarlo;
- barra clara;
- achievements legibles;
- locked/unlocked distinguibles;
- mobile first;
- mantener identidad TFLives.

No añadir animaciones pesadas.

Una animación breve de unlock/level-up es aceptable solo si usa infraestructura existente y es barata.

No implementar confetti complejo.

---

# 28. Responsive

Validar:

- 390px;
- 768px;
- 1366px;
- 1920px.

Evitar barras que desborden o grids enormes.

---

# 29. Accesibilidad

- progreso con `aria` adecuado;
- achievements accesibles por teclado;
- iconos no deben ser la única fuente de significado;
- textos de locked/unlocked claros;
- focus visible.

---

# 30. i18n

Todo texto nuevo:

- ES;
- EN.

No hardcodear nombres/descripciones de achievements directamente en JSX.

El catálogo debe usar keys de traducción.

---

# 31. Tests mínimos

Agregar tests solo para lógica crítica.

## Fórmula
- level calculation;
- boundaries;
- progress percentage.

## XP
- award server-side;
- no duplicate one-time event;
- cap/cooldown;
- level-up correcto.

## Achievements
- unlock;
- no duplicate unlock;
- level milestone;
- XP reward no produce loop.

## Security
- cliente no puede elegir XP;
- otro usuario no puede modificar progreso.

## Existing flows
- profile/chat/DM/friend tests críticos siguen pasando.

No crear una suite enorme.

---

# 32. Migración de usuarios existentes

No hacer backfill complejo de actividad histórica.

Usuarios existentes pueden iniciar desde:

- nivel 1 / XP 0;

o un baseline equivalente sencillo.

No intentar reconstruir XP desde mensajes/amigos históricos.

Solo conservar achievements/progreso generados desde v0.6 en adelante.

---

# 33. Performance

Evitar N+1.

Perfil debe obtener resumen de progreso con query razonable.

No cargar todos los ProgressEvents en perfil.

Achievements pueden cargarse en una query compacta.

No recalcular estadísticas globales en cada request.

---

# 34. Compatibilidad

No romper:

- Better Auth;
- Google/Discord OAuth;
- 2FA;
- settings;
- profiles v0.5;
- username aliases;
- avatar/banner;
- chat;
- DMs;
- friends;
- blocks;
- admin.

---

# 35. Criterios de aceptación

v0.6 está lista cuando:

1. usuarios tienen XP y nivel;
2. fórmula es centralizada;
3. perfil muestra progreso;
4. existen 8–12 achievements reales;
5. achievements se desbloquean automáticamente;
6. no se duplican achievements;
7. acciones repetibles tienen protección básica;
8. no existe endpoint inseguro para añadir XP;
9. level-up notifica;
10. achievement unlock notifica;
11. datos privados no se exponen;
12. usuarios viejos siguen funcionando;
13. ES/EN completo;
14. mobile funciona;
15. tests críticos pasan;
16. typecheck/lint/build pasan;
17. migración queda generada y NO aplicada;
18. no se implementó economía/premium/cosméticos.

---

# 36. Validación final

Ejecutar una sola vez al final:

```bash
npm run db:generate
npm run typecheck
npm test
npm run test:integration
npm run lint
npm run build
git diff --check
```

Si algún script no existe, no inventarlo.

Distinguir errores preexistentes de errores propios.

---

# 37. Git

No:

- commit;
- push;
- force push.

Dejar working tree listo para revisión.

---

# 38. Reporte final

Responder solo con:

## Implemented
## Progression model
## XP sources
## Achievements
## Profile integration
## Anti-abuse
## Notifications
## Database changes
## Validation performed
## Known limitations
## Manual steps required
## Files of special importance

Máximo unas pocas líneas por sección.

No repetir el resumen.

---

# 39. Límite de complejidad

Esta release debe priorizar **un núcleo sólido y pequeño**.

Si durante la auditoría aparecen posibles extras:

- leaderboard;
- quests;
- seasons;
- streaks;
- cosmetics;
- rewards externos;
- admin builder;

NO implementarlos.

No utilizar tiempo restante para “mejoras adicionales”.

Terminar cuando los criterios de aceptación estén completos.

---

# 40. Resultado esperado

TFLives v0.6 debe añadir una capa visible de progreso comunitario que haga que la participación tenga continuidad, sin convertir todavía la plataforma en una economía o sistema de monetización.

Debe quedar preparada para:

- v0.7 TFL Economy;
- v0.8 Cosmetics & Premium;

sin adelantar ninguna de esas funciones.
