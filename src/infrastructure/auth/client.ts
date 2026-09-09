"use client";

import { createAuthClient } from "better-auth/react";

/** Cliente de autenticación de navegador. Todas las sesiones viven en Better Auth. */
export const authClient = createAuthClient();
