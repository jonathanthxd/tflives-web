-- This migration:
-- 1. Replaces FUTURE with COSMETIC_PURCHASE in WalletTransactionSource
-- 2. Removes unused FUTURE from CosmeticAcquisitionSource and PremiumEntitlementSource
-- 3. Drops the unused Message table

-- === WalletTransactionSource: replace FUTURE with COSMETIC_PURCHASE (transaction-safe) ===

CREATE TYPE "WalletTransactionSource_new" AS ENUM ('PROGRESSION', 'ACHIEVEMENT', 'ADMIN', 'COSMETIC_PURCHASE');

ALTER TABLE "WalletTransaction" ADD COLUMN source_new "WalletTransactionSource_new";

UPDATE "WalletTransaction" SET source_new = CASE source::text
  WHEN 'FUTURE' THEN 'COSMETIC_PURCHASE'::"WalletTransactionSource_new"
  ELSE source::text::"WalletTransactionSource_new"
END;

ALTER TABLE "WalletTransaction" DROP COLUMN source;
ALTER TABLE "WalletTransaction" RENAME COLUMN source_new TO source;
ALTER TABLE "WalletTransaction" ALTER COLUMN source SET NOT NULL;

DROP TYPE "WalletTransactionSource";
ALTER TYPE "WalletTransactionSource_new" RENAME TO "WalletTransactionSource";

-- === CosmeticAcquisitionSource: drop FUTURE ===

CREATE TYPE "CosmeticAcquisitionSource_new" AS ENUM ('PURCHASE', 'ADMIN_GRANT');

ALTER TABLE "UserCosmetic" ADD COLUMN source_new "CosmeticAcquisitionSource_new";

UPDATE "UserCosmetic" SET source_new = source::text::"CosmeticAcquisitionSource_new";

ALTER TABLE "UserCosmetic" DROP COLUMN source;
ALTER TABLE "UserCosmetic" RENAME COLUMN source_new TO source;
ALTER TABLE "UserCosmetic" ALTER COLUMN source SET NOT NULL;

DROP TYPE "CosmeticAcquisitionSource";
ALTER TYPE "CosmeticAcquisitionSource_new" RENAME TO "CosmeticAcquisitionSource";

-- === PremiumEntitlementSource: drop FUTURE ===

CREATE TYPE "PremiumEntitlementSource_new" AS ENUM ('ADMIN');

ALTER TABLE "PremiumEntitlement" ADD COLUMN source_new "PremiumEntitlementSource_new";

UPDATE "PremiumEntitlement" SET source_new = source::text::"PremiumEntitlementSource_new";

ALTER TABLE "PremiumEntitlement" DROP COLUMN source;
ALTER TABLE "PremiumEntitlement" RENAME COLUMN source_new TO source;
ALTER TABLE "PremiumEntitlement" ALTER COLUMN source SET NOT NULL;

DROP TYPE "PremiumEntitlementSource";
ALTER TYPE "PremiumEntitlementSource_new" RENAME TO "PremiumEntitlementSource";

-- === Drop unused Message table ===

DROP TABLE "Message" CASCADE;
