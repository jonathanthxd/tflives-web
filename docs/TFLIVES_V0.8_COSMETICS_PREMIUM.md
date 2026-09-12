# TFLives Web — v0.8.0 Cosmetics & Premium
## Directiva compacta para Codex — GPT-5.6 Terra Extra High (Standard)

**Repositorio:** `C:\Users\Administrator\Desktop\web-tflives`  
**Branch:** `main`  
**Release:** `v0.8.0 — Cosmetics & Premium`  
**Prioridad:** capa de personalización y gasto sobre v0.7, segura y pequeña  
**Estado base:** v0.7 TFL Economy funcional + perfiles v0.5/v0.7 rework + progresión/logros v0.6  
**Stack obligatorio:** Next.js App Router + TypeScript + Prisma + Neon PostgreSQL + Better Auth + Vercel + next-intl

---

# 1. Objetivo

Implementar la primera capa real de personalización de TFLives.

v0.8 debe permitir:

- catálogo de cosméticos;
- compra con TFL Coins;
- inventario del usuario;
- equipar/desequipar cosméticos;
- reflejar cosméticos en perfiles;
- catálogo administrable;
- sistema de rareza/tipo;
- premium/entitlements como infraestructura de acceso;
- seguridad económica/idempotencia;
- ES/EN;
- tests y migración aditiva.

No construir pagos con dinero real.

---

# 2. Regla de eficiencia

Haz UNA auditoría dirigida únicamente a:

- wallet/economy service v0.7;
- profile/public identity v0.5/v0.7;
- progression/achievements;
- admin patterns;
- notification system;
- Prisma models relevantes;
- tests.

Después implementa directamente.

No:
- broad repo audit;
- plan previo largo;
- research web salvo API instalada imprescindible;
- refactors generales;
- extras fuera de scope.

---

# 3. Principio de producto

La personalización debe sentirse como recompensa, no como una tienda agresiva.

TFLives debe distinguir:

## Cosméticos
Elementos visuales opcionales que el usuario puede poseer/equipar.

## Premium
Entitlements/beneficios de cuenta que pueden habilitar cosméticos o capacidades premium.

No mezclar premium con roles de staff.

---

# 4. Alcance obligatorio

Implementar:

1. catálogo de cosméticos;
2. tipos de cosmético;
3. rarezas;
4. precio en TFL Coins;
5. compra con wallet v0.7;
6. inventario;
7. equipar/desequipar;
8. visualización en perfil;
9. admin CRUD de cosméticos;
10. disponibilidad activa/inactiva;
11. premium entitlement básico;
12. gating por premium cuando aplique;
13. historial económico correcto;
14. notificaciones relevantes;
15. ES/EN;
16. tests;
17. una migración Prisma aditiva;
18. build final.

---

# 5. Fuera de alcance

NO implementar:

- Stripe;
- PayPal;
- Mercado Pago;
- checkout real-money;
- comprar TFL Coins;
- suscripciones facturadas;
- marketplace user-to-user;
- trading;
- gifting;
- loot boxes;
- gambling;
- NFTs;
- crypto;
- auctions;
- crafting;
- season pass;
- creator shop;
- external store rewrite.

---

# 6. Tipos de cosmético

Mantener pocos tipos en v0.8.

Recomendados:

- `AVATAR_FRAME`
- `PROFILE_ACCENT`
- `PROFILE_BADGE`
- `NAMEPLATE`
- `BANNER_STYLE`

No añadir 20 categorías.

Cada tipo debe tener representación visual clara y segura.

---

# 7. Rarezas

Catálogo simple:

- COMMON
- RARE
- EPIC
- LEGENDARY

La rareza es visual/organizativa.

No debe modificar economía automáticamente salvo precio definido por admin.

No hardcodear precio por rareza.

---

# 8. Modelo conceptual

Propuesta:

```text
Cosmetic
- id
- slug
- type
- rarity
- nameKey / localized fields
- descriptionKey / localized fields
- price
- premiumOnly
- active
- visualConfig
- createdAt
- updatedAt

UserCosmetic
- userId
- cosmeticId
- acquiredAt
- source

EquippedCosmetic
- userId
- type
- cosmeticId
- updatedAt
```

Adaptar a arquitectura existente.

No duplicar si ya hay modelos equivalentes.

---

# 9. Visual config

No permitir CSS/HTML arbitrario desde admin.

Usar configuración tipada y allowlisted.

Ejemplos:

- frame preset;
- accent token;
- badge icon key;
- nameplate preset;
- banner preset.

NO almacenar:
- raw CSS;
- script;
- HTML;
- arbitrary SVG from admin.

---

# 10. Catálogo

Crear una experiencia de catálogo integrada a TFLives.

Puede ser:

`/[locale]/cosmeticos`

o una sección equivalente coherente.

Mostrar:

- preview;
- nombre;
- tipo;
- rareza;
- precio;
- estado: poseído/equipado/bloqueado premium;
- CTA comprar/equipar.

Debe ser responsive y no parecer ecommerce tradicional.

---

# 11. Compra con TFL Coins

Toda compra debe:

1. ocurrir server-side;
2. validar cosmetic activo;
3. validar precio actual;
4. validar balance;
5. evitar duplicados;
6. debitar mediante economy service;
7. crear ownership;
8. ejecutarse transaccionalmente;
9. usar idempotencia;
10. registrar source en ledger.

Nunca aceptar precio enviado por cliente.

Cliente solo envía `cosmeticId`.

---

# 12. Ledger

Usar v0.7.

Compra debe crear movimiento legible:

```text
-250 TFL Coins
Cosmético · Marco Prisma
```

No editar ledger manualmente.

No permitir saldo negativo.

---

# 13. Inventario

Crear `Mis cosméticos`:

- poseídos;
- filtrables por tipo;
- equipados;
- CTA equipar/desequipar.

No crear almacenamiento separado del catálogo.

---

# 14. Equipar

Regla:

- máximo un cosmético equipado por tipo;
- equipar uno reemplaza el anterior del mismo tipo;
- solo puede equiparse si se posee;
- premium-only requiere entitlement activo;
- validación server-side.

No confiar en estado cliente.

---

# 15. Perfil

Integrar sobre el perfil actual sin rediseñarlo otra vez.

Mostrar visualmente:

- avatar frame;
- profile accent;
- badge;
- nameplate;
- banner style;

solo cuando estén equipados.

La página debe seguir legible sin cosméticos.

No permitir que un cosmético rompa layout, contraste o accesibilidad.

---

# 16. Chat / DMs / identidad compacta

Solo propagar cosméticos baratos y útiles.

Preferencia:

- badge pequeño;
- nameplate/accent discreto.

NO renderizar banners/frames complejos en cada mensaje.

Evitar costo innecesario en chat.

---

# 17. Premium entitlement

Crear infraestructura básica de premium sin cobrar dinero.

Concepto:

```text
PremiumEntitlement
- userId
- tier
- startsAt
- expiresAt nullable
- source
- createdAt
```

Tier inicial recomendado:

- `PREMIUM`

No crear 5 planes.

---

# 18. Qué habilita Premium en v0.8

Mantener pequeño:

- acceso a cosméticos `premiumOnly`;
- badge premium discreto opcional;
- quizá prioridad visual en catálogo, no privilegios de moderación.

NO:
- bypass de seguridad;
- permisos admin;
- ventajas económicas desbalanceadas;
- multiplicadores XP enormes.

---

# 19. Origen de Premium

En v0.8 puede ser:

- grant administrativo;
- integración futura preparada.

Si ya existe puente seguro con tienda externa, reutilizarlo solo si es trivial y confiable.

NO construir webhooks/payments nuevos si no existen.

---

# 20. Admin — Cosméticos

Agregar sección admin para:

- crear;
- editar;
- activar/desactivar;
- tipo;
- rareza;
- precio TFL Coins;
- premiumOnly;
- preset visual;
- preview.

No mostrar campos técnicos crudos si puede evitarse.

---

# 21. Admin — Premium

Permitir ADMIN:

- buscar usuario;
- ver estado premium;
- otorgar;
- retirar;
- opcional fecha de expiración;
- razón obligatoria.

Auditar acción.

No permitir self-service desde cliente.

---

# 22. Cosméticos iniciales

Crear pocos ejemplos reales para validar sistema.

Objetivo: 6–10 cosméticos iniciales máximo.

Distribuir entre:
- frames;
- accents;
- badges/nameplates;
- banner style.

No llenar catálogo artificialmente.

---

# 23. Compra repetida

Un usuario no puede comprar dos veces el mismo cosmético.

Retry debe devolver estado consistente sin doble débito.

Usar unique constraints + idempotencia.

---

# 24. Reembolsos

No implementar sistema completo de refunds.

Admin puede corregir mediante ajuste económico manual si fuese necesario.

No borrar ownership/ledger silenciosamente.

---

# 25. Notificaciones

Reutilizar sistema existente.

Notificar:

- compra exitosa;
- premium otorgado/retirado si aplica.

No enviar notificación por equipar cada cosa si genera ruido.

---

# 26. API

Lecturas posibles:

```text
GET /api/cosmetics
GET /api/account/cosmetics
```

Escrituras:

```text
POST /api/account/cosmetics/purchase
POST /api/account/cosmetics/equip
```

Nombres pueden adaptarse.

Todas las escrituras:
- sesión;
- ownership;
- balance;
- entitlement;
- server-side.

---

# 27. Privacidad

Inventario puede ser privado.

Cosméticos equipados son públicos porque forman parte del perfil.

No exponer:
- historial de compras completo públicamente;
- balance;
- admin grants;
- premium source interno.

---

# 28. Prisma

Cambios razonables:

- Cosmetic
- UserCosmetic
- EquippedCosmetic
- PremiumEntitlement
- enums correspondientes

Una sola migración v0.8.

Debe ser:
- aditiva;
- indexada;
- compatible;
- no destructiva.

No aplicar a Neon automáticamente.

---

# 29. Economía e idempotencia

Reutilizar EconomyService.

No crear segunda wallet/reward service.

Para compras:

```text
sourceKey = cosmetic-purchase:<userId>:<cosmeticId>
```

o estrategia equivalente segura.

Ledger + ownership deben ser atómicos.

---

# 30. UX

Catálogo:

- moderno;
- limpio;
- previews claros;
- balance TFL Coins visible;
- filtros por tipo/rareza si son baratos;
- owned/equipped visibles.

Inventario:

- compacto;
- simple;
- fácil de equipar.

No hacer una tienda enorme.

---

# 31. Accesibilidad

- contrastes correctos;
- no depender solo del color de rareza;
- botones reales;
- keyboard;
- focus visible;
- previews con labels;
- animaciones ligeras.

---

# 32. Responsive

Validar:

- 390px;
- 768px;
- 1366px;
- 1920px.

Especialmente:
- catálogo;
- cards;
- preview;
- perfil con cosméticos;
- inventario.

---

# 33. i18n

Todo nuevo:
- ES;
- EN.

No hardcodear rarity/type labels en JSX.

---

# 34. Tests críticos

## Purchase
- sufficient balance;
- insufficient balance;
- cosmetic inactive;
- duplicate purchase;
- premium-only without entitlement;
- ledger/debit correct;
- ownership created once.

## Equip
- only owned item;
- one per type;
- replace previous;
- premium entitlement enforced.

## Premium
- ADMIN grant/revoke;
- USER/MOD denied;
- expiry respected.

## Security
- client price ignored;
- other user's inventory cannot be mutated;
- no negative wallet.

## Profile
- equipped cosmetic resolves safely.

Mantener suite pequeña.

---

# 35. Compatibilidad

No romper:

- auth/OAuth/2FA;
- profiles;
- likes/followers;
- chat;
- DM edit/delete;
- friends;
- team;
- progression;
- achievements;
- admin-created achievements;
- realtime XP bar;
- wallet/economy;
- notifications.

---

# 36. Criterios de aceptación

v0.8 está completa cuando:

1. catálogo funciona;
2. usuario puede comprar con TFL Coins;
3. compra debita una sola vez;
4. inventario funciona;
5. equipar/desequipar funciona;
6. perfil refleja cosméticos;
7. un solo cosmetic por type;
8. premium-only respeta entitlement;
9. admin CRUD funciona;
10. admin premium grant/revoke funciona;
11. no existe real-money payment;
12. no existe marketplace/trading;
13. economy service es reutilizado;
14. ES/EN completo;
15. mobile funciona;
16. tests pasan;
17. build pasa;
18. migración queda generada y NO aplicada.

---

# 37. Validación final

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

Corregir errores propios.

No repetir validaciones caras innecesariamente.

---

# 38. Git

No:
- commit;
- push;
- force push.

---

# 39. Reporte final

Responder solo con:

## Implemented
## Cosmetic model
## Catalog
## Purchases / economy
## Inventory / equip
## Profile integration
## Premium
## Admin controls
## Security / idempotency
## Database changes
## Validation performed
## Known limitations
## Manual steps required
## Files of special importance

Máximo pocas líneas por sección.

---

# 40. Resultado esperado

TFLives v0.8 debe convertir TFL Coins en una moneda con utilidad real mediante personalización visual.

La arquitectura debe dejar:

```text
Progression → TFL Coins → Cosmetics → Profile identity
```

funcionando de extremo a extremo.

Premium debe existir como entitlement seguro y simple, preparado para integraciones futuras, sin construir todavía cobros reales.
