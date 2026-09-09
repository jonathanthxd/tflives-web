import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/infrastructure/database/prisma";
import { sendAuthEmail } from "@/infrastructure/auth/email";

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

export const auth = betterAuth({
  appName: "TFLives",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
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
  },
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
  },
  advanced: {
    database: {
      joins: true,
    },
  },
});
