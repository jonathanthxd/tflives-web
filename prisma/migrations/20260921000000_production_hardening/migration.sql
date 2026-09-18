-- v0.15.0 Production Hardening. Additive only: an error source label and the
-- fixed-window counters used by the DB-backed, per-route rate limiter.

ALTER TABLE "ApplicationError" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'server';

CREATE TABLE "RateLimitCounter" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RateLimitCounter_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimitCounter_updatedAt_idx" ON "RateLimitCounter"("updatedAt");