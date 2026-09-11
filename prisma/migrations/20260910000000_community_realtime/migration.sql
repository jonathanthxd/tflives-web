-- v0.3.0 Community & Realtime. This migration is additive and preserves all
-- existing conversations, reports and notifications.

ALTER TABLE "DirectMessage"
  ALTER COLUMN "content" SET DEFAULT '',
  ADD COLUMN "replyToId" TEXT,
  ADD COLUMN "stickerId" TEXT,
  ADD COLUMN "editedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Report"
  ADD COLUMN "targetUserId" TEXT,
  ADD COLUMN "details" TEXT;

CREATE TABLE "ChatSticker" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "asset_url" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "category" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatSticker_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DirectMessageReaction" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DirectMessageReaction_pkey" PRIMARY KEY ("id")
);

-- There is no channel table because the product intentionally has one global
-- channel. Every row belongs to that single immutable product surface.
CREATE TABLE "GlobalChatMessage" (
  "id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "reply_to_id" TEXT,
  "sticker_id" TEXT,
  "edited_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GlobalChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GlobalChatReaction" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GlobalChatReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GlobalChatReadState" (
  "user_id" TEXT NOT NULL,
  "last_read_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GlobalChatReadState_pkey" PRIMARY KEY ("user_id")
);

CREATE UNIQUE INDEX "ChatSticker_name_key" ON "ChatSticker"("name");
CREATE INDEX "ChatSticker_enabled_display_order_idx" ON "ChatSticker"("enabled", "display_order");
CREATE INDEX "DirectMessage_replyToId_idx" ON "DirectMessage"("replyToId");
CREATE UNIQUE INDEX "DirectMessageReaction_message_id_user_id_emoji_key" ON "DirectMessageReaction"("message_id", "user_id", "emoji");
CREATE INDEX "DirectMessageReaction_message_id_idx" ON "DirectMessageReaction"("message_id");
CREATE INDEX "GlobalChatMessage_created_at_id_idx" ON "GlobalChatMessage"("created_at", "id");
CREATE INDEX "GlobalChatMessage_reply_to_id_idx" ON "GlobalChatMessage"("reply_to_id");
CREATE INDEX "GlobalChatMessage_author_id_created_at_idx" ON "GlobalChatMessage"("author_id", "created_at");
CREATE UNIQUE INDEX "GlobalChatReaction_message_id_user_id_emoji_key" ON "GlobalChatReaction"("message_id", "user_id", "emoji");
CREATE INDEX "GlobalChatReaction_message_id_idx" ON "GlobalChatReaction"("message_id");
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");
CREATE INDEX "Report_targetUserId_idx" ON "Report"("targetUserId");

ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_replyToId_fkey"
  FOREIGN KEY ("replyToId") REFERENCES "DirectMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_stickerId_fkey"
  FOREIGN KEY ("stickerId") REFERENCES "ChatSticker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DirectMessageReaction" ADD CONSTRAINT "DirectMessageReaction_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectMessageReaction" ADD CONSTRAINT "DirectMessageReaction_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GlobalChatMessage" ADD CONSTRAINT "GlobalChatMessage_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GlobalChatMessage" ADD CONSTRAINT "GlobalChatMessage_reply_to_id_fkey"
  FOREIGN KEY ("reply_to_id") REFERENCES "GlobalChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GlobalChatMessage" ADD CONSTRAINT "GlobalChatMessage_sticker_id_fkey"
  FOREIGN KEY ("sticker_id") REFERENCES "ChatSticker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GlobalChatReaction" ADD CONSTRAINT "GlobalChatReaction_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "GlobalChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GlobalChatReaction" ADD CONSTRAINT "GlobalChatReaction_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GlobalChatReadState" ADD CONSTRAINT "GlobalChatReadState_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
