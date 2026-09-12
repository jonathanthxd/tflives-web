-- Obtainable achievements: keep existing manual badges while allowing
-- administrators to define safe, server-evaluated unlock conditions.

CREATE TYPE "AchievementUnlockMode" AS ENUM ('MANUAL', 'AUTOMATIC');
CREATE TYPE "AchievementTrigger" AS ENUM (
  'GLOBAL_MESSAGES',
  'DIRECT_MESSAGES',
  'FRIENDSHIPS',
  'LEVEL',
  'XP',
  'PROFILE_COMPLETE',
  'EMAIL_VERIFIED',
  'OAUTH_CONNECTIONS'
);
CREATE TYPE "AchievementAwardSource" AS ENUM ('MANUAL', 'AUTOMATIC');

ALTER TABLE "Achievement"
  ADD COLUMN "unlockMode" "AchievementUnlockMode" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "trigger" "AchievementTrigger",
  ADD COLUMN "triggerValue" INTEGER;

ALTER TABLE "UserAchievement"
  ADD COLUMN "source" "AchievementAwardSource" NOT NULL DEFAULT 'MANUAL',
  ALTER COLUMN "awardedById" DROP NOT NULL;

CREATE INDEX "Achievement_active_unlockMode_trigger_idx"
  ON "Achievement"("active", "unlockMode", "trigger");

ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_achievementId_fkey";
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey"
  FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
