"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

/** Cliente de autenticación de navegador. Todas las sesiones viven en Better Auth. */
export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect: () => {
        const locale = window.location.pathname.match(/^\/(es|en)(?:\/|$)/)?.[1] ?? "es";
        window.location.assign(`/${locale}/two-factor`);
      },
    }),
  ],
});
