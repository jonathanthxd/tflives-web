-- v0.6.0 Progression & Achievements
-- Additive only. Apply through the normal Neon migration workflow; the app
-- deliberately does not run this migration itself.

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LEVEL_UP';

CREATE TABLE "UserProgress" (
  "userId" TEXT NOT NULL,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "level" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "UserProgressAchievement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserProgressAchievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "xp" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProgressEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserProgressAchievement_userId_code_key"
  ON "UserProgressAchievement"("userId", "code");
CREATE INDEX "UserProgressAchievement_userId_unlockedAt_idx"
  ON "UserProgressAchievement"("userId", "unlockedAt");
CREATE UNIQUE INDEX "ProgressEvent_userId_sourceKey_key"
  ON "ProgressEvent"("userId", "sourceKey");
CREATE INDEX "ProgressEvent_userId_source_createdAt_idx"
  ON "ProgressEvent"("userId", "source", "createdAt");

ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserProgressAchievement" ADD CONSTRAINT "UserProgressAchievement_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressEvent" ADD CONSTRAINT "ProgressEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
