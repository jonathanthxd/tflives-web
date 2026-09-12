import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins/two-factor";
import { prisma } from "@/infrastructure/database/prisma";
import { sendAuthEmail } from "@/infrastructure/auth/email";
import { recordSecurityEvent } from "@/modules/security/service";

const requireEmailVerification = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true";

const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
    ? {
        discord: {
          clientId: process.env.DISCORD_CLIENT_ID,
          clientSecret: process.env.DISCORD_CLIENT_SECRET,
        },
      }
    : {}),
};

const configuredBaseOrigin = process.env.BETTER_AUTH_URL
  ? new URL(process.env.BETTER_AUTH_URL).origin
  : undefined;

/**
 * Explicit origins keep callback and CSRF validation narrow while still
 * allowing a configured Vercel preview URL. Localhost is development-only.
 */
export const trustedAuthOrigins = Array.from(
  new Set(
    [
      "https://www.tflives.com",
      configuredBaseOrigin,
      ...(process.env.NODE_ENV !== "production" ? ["http://localhost:3000"] : []),
    ].filter((origin): origin is string => Boolean(origin))
  )
);

/** Records completed Better Auth endpoint actions without wrapping or replacing them. */
const securityEventPlugin = {
  id: "tflives-security-events",
  hooks: {
    after: [
      {
        matcher: (context: { path?: string }) => [
          "/send-verification-email",
          "/change-password",
          "/two-factor/verify-totp",
          "/two-factor/disable",
          "/two-factor/generate-backup-codes",
        ].includes(context.path ?? ""),
        handler: createAuthMiddleware(async (ctx) => {
          const userId = ctx.context.session?.user.id;
          if (!userId) return;

          const eventByPath = {
            "/send-verification-email": "EMAIL_VERIFICATION_RESENT",
            "/change-password": "PASSWORD_CHANGED",
            "/two-factor/verify-totp": "TWO_FACTOR_ENABLED",
            "/two-factor/disable": "TWO_FACTOR_DISABLED",
            "/two-factor/generate-backup-codes": "RECOVERY_CODES_REGENERATED",
          } as const;
          const event = eventByPath[ctx.path as keyof typeof eventByPath];
          if (event) await recordSecurityEvent({ userId, event });
        }),
      },
    ],
  },
};

export const auth = betterAuth({
  appName: "TFLives",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: trustedAuthOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: !requireEmailVerification,
    requireEmailVerification,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Restablece tu contraseña de TFLives",
        text: `Abre este enlace para crear una nueva contraseña de TFLives: ${url}`,
        html: `<p>Recibimos una solicitud para restablecer tu contraseña de TFLives.</p><p><a href="${url}">Crear una nueva contraseña</a></p><p>Si no fuiste tú, puedes ignorar este mensaje.</p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: requireEmailVerification,
    sendOnSignIn: requireEmailVerification,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Verifica tu cuenta de TFLives",
        text: `Verifica tu cuenta de TFLives abriendo este enlace: ${url}`,
        html: `<p>Gracias por registrarte en TFLives.</p><p><a href="${url}">Verificar mi cuenta</a></p>`,
      });
    },
    afterEmailVerification: async (user) => {
      await recordSecurityEvent({ userId: user.id, event: "EMAIL_VERIFIED" });
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      // Existing identities must actively authenticate and link a provider.
      // This prevents an OAuth response with a matching email from silently
      // attaching itself to a pre-existing local account.
      disableImplicitLinking: true,
      requireLocalEmailVerified: true,
      trustedProviders: [],
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
      updateUserInfoOnLink: false,
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 20,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 60, max: 5 },
      "/request-password-reset": { window: 60 * 60, max: 3 },
      "/reset-password": { window: 15 * 60, max: 5 },
      "/send-verification-email": { window: 60 * 60, max: 3 },
      "/link-social": { window: 15 * 60, max: 5 },
      "/two-factor/*": { window: 15 * 60, max: 10 },
    },
  },
  plugins: [
    twoFactor({
      issuer: "TFLives",
      accountLockout: { enabled: true, maxFailedAttempts: 10, durationSeconds: 15 * 60 },
    }),
    securityEventPlugin,
  ],
  socialProviders,
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // La app histórica de TFLives usa displayName además del campo `name`
          // requerido por Better Auth. OAuth no conoce ese campo, así que lo
          // inicializamos una sola vez con el nombre del proveedor.
          await prisma.user.updateMany({
            where: { id: user.id, displayName: null },
            data: { displayName: user.name },
          });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await recordSecurityEvent({
            userId: session.userId,
            event: "LOGIN_SUCCESS",
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
          });
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          if (account.providerId === "credential") return;
          await recordSecurityEvent({
            userId: account.userId,
            event: "OAUTH_LINKED",
            metadata: { provider: account.providerId },
          });
        },
      },
      delete: {
        before: async (account) => {
          if (account.providerId === "credential") return;
          await recordSecurityEvent({
            userId: account.userId,
            event: "OAUTH_UNLINKED",
            metadata: { provider: account.providerId },
          });
        },
      },
    },
    verification: {
      delete: {
        after: async (verification) => {
          if (verification.identifier.startsWith("reset-password:")) {
            await recordSecurityEvent({ userId: verification.value, event: "PASSWORD_RESET" });
          }
        },
      },
    },
  },
  advanced: {
    database: {
      joins: true,
    },
  },
});
