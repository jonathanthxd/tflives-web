-- Link public team entries to real TFLives accounts.
-- Existing legacy rows remain nullable and will not be shown publicly until an
-- administrator links them to a valid @username from the admin editor.

ALTER TABLE "TeamMember" ADD COLUMN "userId" TEXT;

CREATE UNIQUE INDEX "TeamMember_userId_key" ON "TeamMember"("userId");

ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
