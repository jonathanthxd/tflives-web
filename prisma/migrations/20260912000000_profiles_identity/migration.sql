-- v0.5 Profiles & Identity: additive username-change audit point and
-- case-insensitive community-handle uniqueness. This migration is intentionally
-- not applied by the application; deploy it through the normal Neon workflow.
ALTER TABLE "User" ADD COLUMN "username_changed_at" TIMESTAMP(3);

CREATE TABLE "UsernameAlias" (
    "username" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsernameAlias_pkey" PRIMARY KEY ("username")
);

CREATE UNIQUE INDEX "User_username_lower_unique"
ON "User" (LOWER("username"))
WHERE "username" IS NOT NULL;

CREATE UNIQUE INDEX "UsernameAlias_username_lower_unique"
ON "UsernameAlias" (LOWER("username"));

CREATE INDEX "UsernameAlias_userId_idx" ON "UsernameAlias"("userId");

ALTER TABLE "UsernameAlias" ADD CONSTRAINT "UsernameAlias_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
