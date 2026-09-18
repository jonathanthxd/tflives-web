# e2e

Pruebas end-to-end de los flujos principales (regla 12): registro → sesión →
perfil, login → dashboard, y los endpoints de hardening (ingesta de errores de
cliente + rate limiting), todo sobre HTTP real.

## Cómo correr

El harness levanta `next start` contra un PostgreSQL aislado en memoria (PGlite),
por lo que **requiere un build fresco primero**:

```powershell
npm run build      # prisma generate + next build
npm run test:e2e   # tsx --test tests/e2e/*.test.ts
```

- Puertos aislados: HTTP `3108`, socket PGlite `55438`.
- Nunca lee `DATABASE_URL` real ni toca Neon.
- Si el build está desactualizado, el harness fallará al arrancar; rebuildear.

## Cobertura actual

- `smoke.test.ts`: registro → `get-session` → `PATCH /api/profile` → perfil
  público; login → `/en/configuracion`; `POST /api/observability/client-error`
  (validación, sanitización y persistencia con `source = "client"`); burst que
  dispara `429` por rate limit; escrituras sin sesión → `401`; `/en/admin` sin
  cookie → redirect a login.
