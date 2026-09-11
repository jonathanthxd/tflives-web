import { prisma } from "@/infrastructure/database/prisma";
import { isUnicodeEmojiReaction } from "@/modules/chat/emojis";

export class ChatValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface NormalizedChatPayload {
  content: string;
  replyToId: string | null;
  stickerId: string | null;
}

/** User content is always rendered as text, never HTML or Markdown. */
export function normalizeChatPayload(
  input: unknown,
  maxLength = 2_000,
): NormalizedChatPayload {
  if (!input || typeof input !== "object") {
    throw new ChatValidationError("Payload de mensaje inválido");
  }
  const value = input as Record<string, unknown>;
  const content = typeof value.content === "string" ? value.content.trim() : "";
  const replyToId = typeof value.replyToId === "string" && value.replyToId.trim()
    ? value.replyToId.trim()
    : null;
  const stickerId = typeof value.stickerId === "string" && value.stickerId.trim()
    ? value.stickerId.trim()
    : null;

  if (!content && !stickerId) {
    throw new ChatValidationError("El mensaje no puede estar vacío");
  }
  if (content.length > maxLength) {
    throw new ChatValidationError("El mensaje es demasiado largo");
  }
  if ((replyToId && replyToId.length > 128) || (stickerId && stickerId.length > 128)) {
    throw new ChatValidationError("Payload de mensaje inválido");
  }
  return { content, replyToId, stickerId };
}

/** @everyone is intentionally not a mention. Usernames follow account validation. */
export function parseMentions(content: string, maximum = 5): string[] {
  const mentions = new Set<string>();
  const expression = /(^|[^a-z0-9_])@([a-z][a-z0-9_]{2,19})(?![a-z0-9_-])/gi;
  for (const match of content.matchAll(expression)) {
    const username = match[2].toLowerCase();
    if (username !== "everyone") mentions.add(username);
    if (mentions.size >= maximum) break;
  }
  return [...mentions];
}

export function assertReactionEmoji(value: unknown): asserts value is string {
  if (!isUnicodeEmojiReaction(value)) {
    throw new ChatValidationError("Reacción inválida");
  }
}

/**
 * Durable, database-backed burst controls work across Vercel instances. They
 * deliberately leave room for normal conversation instead of punishing a fast
 * reply or a single correction.
 */
export async function assertRecentActionLimit({
  count,
  since,
  maximum,
  message,
}: {
  count: () => Promise<number>;
  since: Date;
  maximum: number;
  message: string;
}) {
  void since;
  const recent = await count();
  if (recent >= maximum) throw new ChatValidationError(message, 429);
}

export async function requireEnabledSticker(stickerId: string | null) {
  if (!stickerId) return null;
  const sticker = await prisma.chatSticker.findFirst({
    where: { id: stickerId, enabled: true },
    select: { id: true, name: true, assetUrl: true, category: true },
  });
  if (!sticker) throw new ChatValidationError("Sticker no disponible", 404);
  return sticker;
}
