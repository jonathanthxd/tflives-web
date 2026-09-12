-- v0.9 Streamers & Creator Ecosystem. Additive only: creator records are
-- anchored to existing users and no account, social, or profile data changes.
CREATE TYPE "CreatorStatus" AS ENUM ('ACTIVE', 'PAUSED');
CREATE TYPE "CreatorCategory" AS ENUM ('MINECRAFT', 'FORTNITE', 'ROBLOX', 'VARIETY', 'JUST_CHATTING', 'OTHER');
CREATE TYPE "CreatorPlatformType" AS ENUM ('TWITCH', 'YOUTUBE', 'KICK', 'TIKTOK', 'FACEBOOK_GAMING', 'EXTERNAL');
CREATE TYPE "CreatorApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CREATOR_APPLICATION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CREATOR_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CREATOR_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CREATOR_STATUS';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CREATOR_FEATURED';

CREATE TABLE "CreatorProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "CreatorStatus" NOT NULL DEFAULT 'ACTIVE',
  "category" "CreatorCategory" NOT NULL,
  "headline" TEXT,
  "description" TEXT NOT NULL,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "featuredOrder" INTEGER,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreatorApplication" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "primaryPlatform" "CreatorPlatformType" NOT NULL,
  "channelUrl" TEXT NOT NULL,
  "category" "CreatorCategory" NOT NULL,
  "description" TEXT NOT NULL,
  "motivation" TEXT NOT NULL,
  "activityFrequency" TEXT,
  "status" "CreatorApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "adminNote" TEXT,
  "rejectionMessage" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreatorPlatform" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "type" "CreatorPlatformType" NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorPlatform_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorProfile_userId_key" ON "CreatorProfile"("userId");
CREATE INDEX "CreatorProfile_status_featured_featuredOrder_idx" ON "CreatorProfile"("status", "featured", "featuredOrder");
CREATE INDEX "CreatorProfile_status_category_idx" ON "CreatorProfile"("status", "category");
CREATE UNIQUE INDEX "CreatorApplication_one_pending_per_user" ON "CreatorApplication"("userId") WHERE "status" = 'PENDING';
CREATE INDEX "CreatorApplication_userId_status_idx" ON "CreatorApplication"("userId", "status");
CREATE INDEX "CreatorApplication_status_createdAt_idx" ON "CreatorApplication"("status", "createdAt");
CREATE INDEX "CreatorApplication_reviewedById_idx" ON "CreatorApplication"("reviewedById");
CREATE UNIQUE INDEX "CreatorPlatform_creatorId_type_key" ON "CreatorPlatform"("creatorId", "type");
CREATE INDEX "CreatorPlatform_creatorId_idx" ON "CreatorPlatform"("creatorId");

ALTER TABLE "CreatorProfile" ADD CONSTRAINT "CreatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorApplication" ADD CONSTRAINT "CreatorApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorApplication" ADD CONSTRAINT "CreatorApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CreatorPlatform" ADD CONSTRAINT "CreatorPlatform_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
