-- CreateEnum
CREATE TYPE "ModalityStatus" AS ENUM ('ONLINE', 'MAINTENANCE', 'COMING_SOON', 'OFFLINE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentState" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PostType" ADD VALUE 'CHANGELOG';
ALTER TYPE "PostType" ADD VALUE 'MAINTENANCE';

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_modalityId_fkey";

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "socialLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'es',
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "translations" JSONB,
ALTER COLUMN "modalityId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Modality" ADD COLUMN     "banner" TEXT,
ADD COLUMN     "content" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "minecraftVersion" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" "ModalityStatus" NOT NULL DEFAULT 'COMING_SOON',
ADD COLUMN     "translations" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Modality" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "WikiCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "translations" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WikiCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'es',
    "translations" JSONB,
    "state" "ContentState" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categoryId" TEXT,
    "modalityId" TEXT,
    "editorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WikiArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineMilestone" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "image" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "translations" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineMilestone_pkey" PRIMARY KEY ("id")
);

-- Preserve existing entries and give each existing modality a collision-free URL.
UPDATE "Modality" SET "slug" = 'mode-' || encode(convert_to("id", 'UTF8'), 'hex'), "published" = true;
ALTER TABLE "Modality" ALTER COLUMN "slug" SET NOT NULL;
UPDATE "Post" SET "publishedAt" = COALESCE("scheduledFor", "createdAt") WHERE "published" = true;

-- CreateIndex
CREATE UNIQUE INDEX "WikiCategory_slug_key" ON "WikiCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WikiArticle_slug_key" ON "WikiArticle"("slug");

-- CreateIndex
CREATE INDEX "WikiArticle_state_scheduledFor_updatedAt_idx" ON "WikiArticle"("state", "scheduledFor", "updatedAt");

-- CreateIndex
CREATE INDEX "WikiArticle_categoryId_idx" ON "WikiArticle"("categoryId");

-- CreateIndex
CREATE INDEX "WikiArticle_modalityId_idx" ON "WikiArticle"("modalityId");

-- CreateIndex
CREATE INDEX "TimelineMilestone_published_archived_order_idx" ON "TimelineMilestone"("published", "archived", "order");

-- CreateIndex
CREATE INDEX "Post_published_archived_scheduledFor_idx" ON "Post"("published", "archived", "scheduledFor");

-- CreateIndex
CREATE INDEX "Post_type_publishedAt_idx" ON "Post"("type", "publishedAt");

-- CreateIndex
CREATE INDEX "Post_modalityId_idx" ON "Post"("modalityId");

-- CreateIndex
CREATE UNIQUE INDEX "Modality_slug_key" ON "Modality"("slug");

-- CreateIndex
CREATE INDEX "Modality_published_status_order_idx" ON "Modality"("published", "status", "order");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "Modality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiArticle" ADD CONSTRAINT "WikiArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "WikiCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiArticle" ADD CONSTRAINT "WikiArticle_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "Modality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiArticle" ADD CONSTRAINT "WikiArticle_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineMilestone" ADD CONSTRAINT "TimelineMilestone_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

