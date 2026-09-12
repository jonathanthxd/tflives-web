-- v0.11.0 Analytics & Observability. This migration is additive and does not
-- alter, remove, or replay any product or account data.

CREATE TYPE "AnalyticsEventType" AS ENUM ('PROFILE_COMPLETED', 'COSMETIC_EQUIPPED');
CREATE TYPE "ApplicationErrorStatus" AS ENUM ('OPEN', 'RESOLVED', 'IGNORED');

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "type" "AnalyticsEventType" NOT NULL,
  "userId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'server',
  "sourceKey" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationError" (
  "id" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "status" "ApplicationErrorStatus" NOT NULL DEFAULT 'OPEN',
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastStatus" INTEGER,
  "metadata" JSONB,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "ApplicationError_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnalyticsEvent_sourceKey_key" ON "AnalyticsEvent"("sourceKey");
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
CREATE UNIQUE INDEX "ApplicationError_fingerprint_key" ON "ApplicationError"("fingerprint");
CREATE INDEX "ApplicationError_status_lastSeenAt_idx" ON "ApplicationError"("status", "lastSeenAt");
CREATE INDEX "ApplicationError_lastSeenAt_idx" ON "ApplicationError"("lastSeenAt");

-- Existing product records are the source of truth for most metrics. These
-- focused timestamp indexes keep 7/30/90 day aggregation bounded.
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "Follow_createdAt_idx" ON "Follow"("createdAt");
CREATE INDEX "DirectMessage_createdAt_idx" ON "DirectMessage"("createdAt");
CREATE INDEX "Reaction_createdAt_idx" ON "Reaction"("createdAt");
CREATE INDEX "UserProgressAchievement_unlockedAt_idx" ON "UserProgressAchievement"("unlockedAt");
CREATE INDEX "UserAchievement_awardedAt_idx" ON "UserAchievement"("awardedAt");
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");
CREATE INDEX "UserCosmetic_acquired_at_idx" ON "UserCosmetic"("acquired_at");
CREATE INDEX "CreatorApplication_createdAt_idx" ON "CreatorApplication"("createdAt");
CREATE INDEX "CreatorApplication_reviewedAt_idx" ON "CreatorApplication"("reviewedAt");

ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
