-- Add optional English copy without changing existing awards or rewards.
ALTER TABLE "Achievement" ADD COLUMN "nameEn" TEXT, ADD COLUMN "descriptionEn" TEXT;
