# TFLives Web — v0.7.0 TFL Economy
## Directiva compacta para Codex — GPT-5.6 Terra Extra High (Standard)

**Repositorio:** `C:\Users\Administrator\Desktop\web-tflives`  
**Branch:** `main`  
**Release:** `v0.7.0 — TFL Economy`  
**Prioridad:** economía interna segura, auditable y pequeña; mínimo consumo de contexto  
**Estado base:** v0.6 Progression & Achievements funcional, incluyendo logros automáticos/admin  
**Stack obligatorio:** Next.js App Router + TypeScript + Prisma + Neon PostgreSQL + Better Auth + Vercel + next-intl

---

# 1. Objetivo

Crear la base económica interna de TFLives mediante una moneda virtual propia: **TFL Coins**.

v0.7 debe implementar:

- wallet/balance por usuario;
- ledger de transacciones;
- recompensas automáticas controladas;
- integración con progresión/logros;
- historial de movimientos;
- administración segura;
- idempotencia y anti-abuso;
- UI de wallet coherente con TFLives.

La economía debe quedar preparada para que v0.8 Cosmetics & Premium pueda consumir TFL Coins sin rehacer la arquitectura.

---

# 2. Regla de eficiencia

Haz una auditoría dirigida UNA sola vez únicamente de:

- Prisma: User, progression, achievements, notifications, admin;
- servicio central de progression;
- logros base y logros creados desde admin;
- perfil/navbar/settings si ya muestran progreso;
- patrones de admin actuales;
- tests relevantes.

Después implementa directamente.

No hagas auditoría general del repo.
No entregues plan previo.
No investigues en web salvo API instalada imprescindible.
No refactorices áreas no necesarias.

---

# 3. Principio económico

**TFL Coins son moneda virtual interna sin valor monetario real.**

En v0.7:

- no se compran con dinero;
- no se retiran;
- no se canjean por dinero;
- no se transfieren entre usuarios;
- no existe marketplace;
- no existe gambling;
- no existen compras premium.

Son un sistema de recompensa y una base para futuras funciones internas.

---

# 4. Alcance obligatorio

Implementar:

1. wallet por usuario;
2. balance disponible;
3. ledger/transacciones inmutables;
4. tipos/source claros;
5. recompensas por hitos seleccionados;
6. recompensas configurables en logros administrables;
7. historial de movimientos;
8. resumen de wallet en UI;
9. admin: otorgar/descontar con razón;
10. auditabilidad;
11. idempotencia;
12. notificaciones para movimientos relevantes;
13. ES/EN;
14. tests críticos;
15. una migración Prisma aditiva;
16. build final.

---

# 5. Fuera de alcance

NO implementar:

- compra de TFL Coins con dinero;
- Stripe/PayPal/Mercado Pago;
- marketplace;
- tienda interna;
- cosméticos;
- premium;
- suscripciones;
- trading;
- transferencias user-to-user;
- gifts;
- gambling;
- loot boxes;
- subastas;
- exchange rates;
- withdrawal/cashout;
- leaderboard económico;
- impuestos;
- quests;
- streaks;
- season pass.

---

# 6. Modelo económico

Preferir arquitectura ledger-first.

Propuesta conceptual:

```text
Wallet
- userId
- balance
- updatedAt

WalletTransaction
- id
- walletId/userId
- type
- amount
- balanceAfter
- source
- sourceKey
- description/meta segura
- createdAt
```

`amount` firmado:

- positivo = crédito;
- negativo = débito.

`balance` puede persistirse como cache transaccional para lectura rápida.

No usar floats.

Usar enteros.

---

# 7. Ledger como fuente de verdad

Toda modificación de balance debe:

1. ocurrir server-side;
2. crear una transacción;
3. actualizar wallet;
4. ejecutarse en transacción Prisma cuando corresponda;
5. validar que el balance no quede negativo;
6. usar idempotency/sourceKey cuando la operación pueda repetirse.

No crear un endpoint genérico público:

```text
POST /addCoins
```

No aceptar `amount` libre desde clientes normales.

---

# 8. Moneda

Nombre público:

**TFL Coins**

Abreviatura visual permitida:

**TFL**

Evitar símbolos que parezcan dinero real.

No usar `$`.

Representar como enteros:

```text
1,250 TFL Coins
```

---

# 9. Fuentes iniciales de TFL Coins

Mantener pocas y comprensibles.

Recomendadas:

- level-up;
- achievements;
- ciertos achievements administrables con `coinReward`;
- grants manuales de admin.

No otorgar monedas por cada mensaje.

No ligar TFL Coins directamente al spam/repetición de chat.

XP puede seguir siendo la recompensa granular; TFL Coins deben sentirse más valiosas.

---

# 10. Recompensa por niveles

Usar recompensa sencilla y centralizada.

Ejemplo:

- cada level-up: pequeña recompensa;
- niveles milestone (5, 10, 25...) pueden dar extra si ya encaja con progression.

No crear tablas enormes.

Centralizar fórmula/config.

Debe ser idempotente: un mismo level-up nunca paga dos veces.

---

# 11. Recompensas por logros

Integrar con el sistema actual de achievements.

Logros base:
- permitir `coinReward` definido en catálogo.

Logros automáticos creados por admin:
- añadir campo amigable:
  `Recompensa en TFL Coins`
- opcional;
- mínimo 0;
- máximo razonable definido server-side.

Al desbloquear:
- award achievement;
- award XP si aplica;
- award TFL Coins si aplica;
- emitir notificación;
- todo de forma segura/idempotente.

No crear loops de recompensa.

---

# 12. Admin — crear/editar logros

En la UI actual de logros, añadir una sección visual:

```text
Recompensas
XP: ...
TFL Coins: ...
```

No exponer términos técnicos como ledger/sourceKey.

Mantener la UI humana.

---

# 13. Wallet del usuario

Crear una experiencia simple, preferentemente:

`Configuración → Wallet / TFL Coins`

o una sección/ruta coherente con la navegación existente.

Mostrar:

- balance actual;
- explicación breve;
- movimientos recientes;
- tipo de movimiento;
- cantidad;
- fecha/hora amigable;
- saldo resultante opcional.

No convertirlo en banca.

---

# 14. Navbar / perfil

Si encaja limpiamente:

- mostrar balance compacto en menú de usuario o perfil;
- no saturar navbar;
- no mostrar balance de otros usuarios públicamente por defecto.

TFL Coins son información privada salvo decisión futura.

---

# 15. Historial de transacciones

Mostrar únicamente transacciones del usuario autenticado.

Tipos legibles:

- Recompensa por nivel;
- Logro desbloqueado;
- Ajuste administrativo;
- Reversión administrativa si se implementa;
- Futuro gasto (preparado, no usado todavía).

No mostrar IDs internos.

---

# 16. Administración de balances

En admin, permitir a ADMIN:

- buscar usuario;
- ver balance;
- ver movimientos recientes;
- otorgar TFL Coins;
- descontar TFL Coins;
- exigir una razón.

No permitir:

- balance negativo;
- editar directamente el número sin ledger;
- borrar transacciones;
- cambiar transacciones históricas.

Toda operación debe quedar auditada.

---

# 17. Seguridad admin

Server-side:

- validar rol;
- amount entero;
- límites razonables por operación;
- reason obligatoria;
- target user existente;
- no aceptar userId privilegiado sin autorización.

Opcional: rate limit suave para operaciones administrativas.

---

# 18. Idempotencia

Usar `sourceKey` único cuando aplique.

Ejemplos:

```text
level-up:userId:5
achievement:userId:achievementId
admin-adjustment:<uuid>
```

No generar dos pagos por:
- retry;
- polling;
- requests concurrentes;
- doble procesamiento de achievement.

---

# 19. Balance inicial

Usuarios existentes:

```text
0 TFL Coins
```

No hacer backfill económico histórico.

No reconstruir monedas a partir de logros/levels anteriores a v0.7.

Las recompensas se aplican desde v0.7 hacia adelante.

---

# 20. Notificaciones

Reutilizar infraestructura existente.

Notificar solo movimientos relevantes:

- reward grande por level milestone;
- achievement con TFL Coins;
- ajuste administrativo.

No notificar cada detalle si genera spam.

Si ya existe toast/bell, reutilizarlo.

---

# 21. API

Lectura:

```text
GET /api/account/wallet
```

puede devolver:
- balance;
- movimientos paginados/resumen.

Escritura normal:
- ninguna API pública para sumar/restar.

Admin:
- endpoint protegido específico para ajustes.

---

# 22. DTO público/privado

Usar DTO mínimo:

```ts
type WalletSummary = {
  balance: number;
  recentTransactions: WalletTransactionView[];
};
```

No exponer:
- sourceKey interno si no hace falta;
- metadata sensible;
- IDs de auditoría;
- información de otros usuarios.

---

# 23. Prisma

Cambios razonables:

- `Wallet`;
- `WalletTransaction`;
- enum(s) de tipo/source;
- `coinReward` en modelo de logros administrables si existe modelo persistido.

Una sola migración v0.7.

Debe ser:
- aditiva;
- compatible;
- indexada;
- sin pérdida de datos;
- sin reset.

No aplicar a Neon automáticamente.

---

# 24. Performance

- wallet lookup simple;
- paginar historial;
- no sumar todo el ledger en cada request;
- evitar N+1;
- balance persistido y actualizado transaccionalmente;
- índices por userId/createdAt/sourceKey.

---

# 25. UI/UX

Mantener identidad TFLives.

Wallet:
- balance principal claro;
- iconografía propia simple;
- movimientos como lista;
- créditos/debitos distinguibles sin depender solo de color;
- mobile first.

No hacer estética bancaria ni crypto.

---

# 26. Formato temporal

Reutilizar el helper de fechas/horas amigables actual.

Preferencia visible para usuarios:

- formato 12h / AM-PM localizado;
- no timestamps técnicos.

---

# 27. i18n

Todo nuevo:
- ES;
- EN.

No hardcodear nombres de transaction types en JSX.

---

# 28. Tests críticos

Solo tests esenciales.

## Wallet
- wallet default = 0;
- credit;
- debit;
- cannot go negative;
- ledger created;
- balanceAfter correct.

## Idempotency
- repeated sourceKey does not duplicate payment.

## Progression integration
- level-up pays once;
- achievement coinReward pays once.

## Admin
- USER/MOD denied;
- ADMIN allowed;
- reason required;
- no negative final balance.

## Security
- user cannot mutate own balance directly;
- cannot read another user's wallet.

---

# 29. Compatibilidad

No romper:

- auth;
- OAuth;
- 2FA;
- profiles;
- username aliases;
- chat;
- DMs edit/delete;
- friends;
- progression;
- achievements;
- automatic admin-created achievements;
- notifications;
- team.

---

# 30. Criterios de aceptación

v0.7 está completa cuando:

1. cada usuario tiene wallet lógico;
2. balance inicia en 0;
3. ledger registra toda modificación;
4. balance nunca cambia sin transacción;
5. level-up puede otorgar monedas de forma idempotente;
6. achievements pueden otorgar monedas;
7. admin-created achievements soportan coinReward;
8. wallet UI muestra balance/historial;
9. admin puede grant/deduct con reason;
10. no existe endpoint inseguro para addCoins;
11. balance no puede ser negativo;
12. usuarios no pueden ver wallets ajenas;
13. ES/EN completo;
14. mobile funciona;
15. tests críticos pasan;
16. typecheck/lint/build pasan;
17. migración queda generada y NO aplicada;
18. no se implementó marketplace/premium/real-money.

---

# 31. Validación final

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

No repetir validaciones caras innecesariamente.

---

# 32. Git

No:
- commit;
- push;
- force push.

---

# 33. Reporte final

Responder solo con:

## Implemented
## Economy model
## Coin sources
## Achievement integration
## Wallet UX
## Admin controls
## Security / idempotency
## Database changes
## Validation performed
## Known limitations
## Manual steps required
## Files of special importance

Máximo unas pocas líneas por sección.

---

# 34. Límite de complejidad

Si aparecen ideas como:

- tienda;
- cosméticos;
- premium;
- marketplace;
- transferencias;
- gifting;
- compra de monedas;
- Stripe;
- quests;
- leaderboards;

NO implementarlas.

v0.7 es la **infraestructura económica**, no la tienda.

---

# 35. Resultado esperado

TFLives v0.7 debe terminar con una moneda interna segura y auditable que:

- tenga balance real;
- tenga ledger;
- se gane mediante progresión/logros;
- pueda administrarse;
- sea imposible de autoasignar desde cliente;
- esté lista para convertirse en método de gasto en v0.8.

No adelantarse a v0.8.
