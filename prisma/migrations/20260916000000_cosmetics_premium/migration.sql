-- v0.8 Cosmetics & Premium. Additive only: no existing user, wallet, or
-- ledger data is modified. This migration is intentionally not applied here.
CREATE TYPE "CosmeticType" AS ENUM ('AVATAR_FRAME', 'PROFILE_ACCENT', 'PROFILE_BADGE', 'NAMEPLATE', 'BANNER_STYLE');
CREATE TYPE "CosmeticRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');
CREATE TYPE "CosmeticVisualPreset" AS ENUM ('BRONZE_FRAME', 'PRISM_FRAME', 'AURORA_ACCENT', 'AMBER_ACCENT', 'STAR_BADGE', 'CROWN_BADGE', 'VIOLET_NAMEPLATE', 'SUNSET_BANNER');
CREATE TYPE "CosmeticAcquisitionSource" AS ENUM ('PURCHASE', 'ADMIN_GRANT', 'FUTURE');
CREATE TYPE "PremiumTier" AS ENUM ('PREMIUM');
CREATE TYPE "PremiumEntitlementSource" AS ENUM ('ADMIN', 'FUTURE');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COSMETIC';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PREMIUM';

CREATE TABLE "Cosmetic" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "CosmeticType" NOT NULL,
  "rarity" "CosmeticRarity" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "name_en" TEXT NOT NULL,
  "description_en" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "premiumOnly" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "visualPreset" "CosmeticVisualPreset" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cosmetic_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Cosmetic_price_nonnegative" CHECK ("price" >= 0)
);

CREATE TABLE "UserCosmetic" (
  "user_id" TEXT NOT NULL,
  "cosmetic_id" TEXT NOT NULL,
  "source" "CosmeticAcquisitionSource" NOT NULL DEFAULT 'PURCHASE',
  "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserCosmetic_pkey" PRIMARY KEY ("user_id", "cosmetic_id")
);

CREATE TABLE "EquippedCosmetic" (
  "user_id" TEXT NOT NULL,
  "type" "CosmeticType" NOT NULL,
  "cosmetic_id" TEXT NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EquippedCosmetic_pkey" PRIMARY KEY ("user_id", "type")
);

CREATE TABLE "PremiumEntitlement" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "tier" "PremiumTier" NOT NULL DEFAULT 'PREMIUM',
  "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "source" "PremiumEntitlementSource" NOT NULL DEFAULT 'ADMIN',
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PremiumEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Cosmetic_slug_key" ON "Cosmetic"("slug");
CREATE INDEX "Cosmetic_active_type_rarity_idx" ON "Cosmetic"("active", "type", "rarity");
CREATE INDEX "UserCosmetic_user_id_acquired_at_idx" ON "UserCosmetic"("user_id", "acquired_at");
CREATE INDEX "EquippedCosmetic_cosmetic_id_idx" ON "EquippedCosmetic"("cosmetic_id");
CREATE INDEX "PremiumEntitlement_user_id_tier_starts_at_expires_at_revoked_at_idx" ON "PremiumEntitlement"("user_id", "tier", "starts_at", "expires_at", "revoked_at");

ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_cosmetic_id_fkey" FOREIGN KEY ("cosmetic_id") REFERENCES "Cosmetic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EquippedCosmetic" ADD CONSTRAINT "EquippedCosmetic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EquippedCosmetic" ADD CONSTRAINT "EquippedCosmetic_cosmetic_id_fkey" FOREIGN KEY ("cosmetic_id") REFERENCES "Cosmetic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PremiumEntitlement" ADD CONSTRAINT "PremiumEntitlement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
