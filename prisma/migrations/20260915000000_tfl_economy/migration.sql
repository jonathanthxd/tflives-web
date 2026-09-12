-- v0.7.0 TFL Economy
-- Additive only. This migration is intentionally not applied by the app.

CREATE TYPE "WalletTransactionType" AS ENUM (
  'LEVEL_REWARD',
  'ACHIEVEMENT_REWARD',
  'ADMIN_GRANT',
  'ADMIN_DEDUCT',
  'SPEND'
);

CREATE TYPE "WalletTransactionSource" AS ENUM (
  'PROGRESSION',
  'ACHIEVEMENT',
  'ADMIN',
  'FUTURE'
);

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TFL_COINS';

ALTER TABLE "Achievement" ADD COLUMN "coinReward" INTEGER NOT NULL DEFAULT 0
  CHECK ("coinReward" >= 0 AND "coinReward" <= 100000);

CREATE TABLE "Wallet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Wallet_balance_nonnegative" CHECK ("balance" >= 0),
  CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WalletTransaction" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "type" "WalletTransactionType" NOT NULL,
  "source" "WalletTransactionSource" NOT NULL,
  "amount" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletTransaction_amount_nonzero" CHECK ("amount" <> 0),
  CONSTRAINT "WalletTransaction_balanceAfter_nonnegative" CHECK ("balanceAfter" >= 0),
  CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");
CREATE UNIQUE INDEX "WalletTransaction_walletId_sourceKey_key" ON "WalletTransaction"("walletId", "sourceKey");
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt");
CREATE INDEX "WalletTransaction_source_createdAt_idx" ON "WalletTransaction"("source", "createdAt");

ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
