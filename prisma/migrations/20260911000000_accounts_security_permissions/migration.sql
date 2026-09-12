-- v0.4.0 Accounts, Security & Permissions
-- Additive only. Review and apply manually with `prisma migrate deploy`.

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SECURITY_ALERT';

CREATE TYPE "SecurityEventType" AS ENUM (
  'LOGIN_SUCCESS',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET',
  'EMAIL_VERIFIED',
  'EMAIL_VERIFICATION_RESENT',
  'OAUTH_LINKED',
  'OAUTH_UNLINKED',
  'SESSION_REVOKED',
  'OTHER_SESSIONS_REVOKED',
  'TWO_FACTOR_ENABLED',
  'TWO_FACTOR_DISABLED',
  'RECOVERY_CODES_REGENERATED',
  'AUTH_RATE_LIMITED'
);

ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "RateLimit" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "lastRequest" BIGINT NOT NULL,
  CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TwoFactor" (
  "id" TEXT NOT NULL,
  "secret" TEXT NOT NULL,
  "backupCodes" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT true,
  "failedVerificationCount" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  CONSTRAINT "TwoFactor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SecurityEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "event" "SecurityEventType" NOT NULL,
  "ipHash" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");
CREATE UNIQUE INDEX "TwoFactor_userId_key" ON "TwoFactor"("userId");
CREATE INDEX "TwoFactor_secret_idx" ON "TwoFactor"("secret");
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");
CREATE INDEX "SecurityEvent_event_createdAt_idx" ON "SecurityEvent"("event", "createdAt");

ALTER TABLE "TwoFactor" ADD CONSTRAINT "TwoFactor_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
