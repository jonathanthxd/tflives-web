-- This migration:
-- 1. Replaces FUTURE with COSMETIC_PURCHASE in WalletTransactionSource
-- 2. Removes unused FUTURE from CosmeticAcquisitionSource and PremiumEntitlementSource
-- 3. Drops the unused Message table

-- === WalletTransactionSource: add COSMETIC_PURCHASE, migrate data, drop FUTURE ===

-- Add the new value
ALTER TYPE "WalletTransactionSource" ADD VALUE 'COSMETIC_PURCHASE' BEFORE 'FUTURE';

-- Migrate any existing FUTURE rows to the new value
UPDATE "WalletTransaction" SET source = 'COSMETIC_PURCHASE' WHERE source = 'FUTURE';

-- Create a clean enum without FUTURE
CREATE TYPE "WalletTransactionSource_new" AS ENUM ('PROGRESSION', 'ACHIEVEMENT', 'ADMIN', 'COSMETIC_PURCHASE');

-- Migrate the column
ALTER TABLE "WalletTransaction" ALTER COLUMN source TYPE "WalletTransactionSource_new" USING source::text::"WalletTransactionSource_new";

-- Drop old enum and rename new
ALTER TYPE "WalletTransactionSource" RENAME TO "WalletTransactionSource_old";
ALTER TYPE "WalletTransactionSource_new" RENAME TO "WalletTransactionSource";
DROP TYPE "WalletTransactionSource_old";

-- === CosmeticAcquisitionSource: drop FUTURE ===

CREATE TYPE "CosmeticAcquisitionSource_new" AS ENUM ('PURCHASE', 'ADMIN_GRANT');

ALTER TABLE "UserCosmetic" ALTER COLUMN source TYPE "CosmeticAcquisitionSource_new" USING source::text::"CosmeticAcquisitionSource_new";

ALTER TYPE "CosmeticAcquisitionSource" RENAME TO "CosmeticAcquisitionSource_old";
ALTER TYPE "CosmeticAcquisitionSource_new" RENAME TO "CosmeticAcquisitionSource";
DROP TYPE "CosmeticAcquisitionSource_old";

-- === PremiumEntitlementSource: drop FUTURE ===

CREATE TYPE "PremiumEntitlementSource_new" AS ENUM ('ADMIN');

ALTER TABLE "PremiumEntitlement" ALTER COLUMN source TYPE "PremiumEntitlementSource_new" USING source::text::"PremiumEntitlementSource_new";

ALTER TYPE "PremiumEntitlementSource" RENAME TO "PremiumEntitlementSource_old";
ALTER TYPE "PremiumEntitlementSource_new" RENAME TO "PremiumEntitlementSource";
DROP TYPE "PremiumEntitlementSource_old";

-- === Drop unused Message table ===

DROP TABLE "Message" CASCADE;
