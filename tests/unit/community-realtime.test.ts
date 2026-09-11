import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertReactionEmoji,
  ChatValidationError,
  normalizeChatPayload,
  parseMentions,
} from "../../src/modules/chat/shared";
import { getNotificationHref } from "../../src/modules/notifications/links";

test("chat payloads are bounded and require text or an official sticker", () => {
  assert.deepEqual(normalizeChatPayload({ content: " hello ", replyToId: "reply" }), {
    content: "hello", replyToId: "reply", stickerId: null,
  });
  assert.deepEqual(normalizeChatPayload({ stickerId: "official" }), {
    content: "", replyToId: null, stickerId: "official",
  });
  assert.throws(() => normalizeChatPayload({ content: " " }), ChatValidationError);
  assert.throws(() => normalizeChatPayload({ content: "x".repeat(2001) }), ChatValidationError);
});

test("mentions only resolve valid usernames and never create everyone pings", () => {
  assert.deepEqual(
    parseMentions("@alice @ALICE, @everyone @not-valid @xy @bob_2 @charlie"),
    ["alice", "bob_2", "charlie"],
  );
  assert.deepEqual(parseMentions("@a1 @user-one @valid_user"), ["valid_user"]);
});

test("chat reactions accept Unicode emoji graphemes and reject arbitrary text", () => {
  assert.doesNotThrow(() => assertReactionEmoji("🔥"));
  assert.doesNotThrow(() => assertReactionEmoji("🫡"));
  assert.doesNotThrow(() => assertReactionEmoji("🇨🇴"));
  assert.doesNotThrow(() => assertReactionEmoji("👩‍💻"));
  assert.throws(() => assertReactionEmoji("hello"), ChatValidationError);
  assert.throws(() => assertReactionEmoji("<img src=x>"), ChatValidationError);
});

test("chat notification destinations preserve chat privacy contexts", () => {
  assert.equal(getNotificationHref({ type: "MENTION", entityType: "GlobalChatMessage", entityId: "m1" }), "/comunidad#chat-global");
  assert.equal(getNotificationHref({ type: "MESSAGE", entityType: "Conversation", entityId: "c1" }), "/mensajes?c=c1");
  assert.equal(getNotificationHref({ type: "REACTION", entityType: "DirectMessage", entityId: "m2" }), "/mensajes");
});

test("all new community UI namespaces have matching locales", () => {
  const es = JSON.parse(readFileSync("messages/es.json", "utf8"));
  const en = JSON.parse(readFileSync("messages/en.json", "utf8"));
  assert.deepEqual(Object.keys(es.GlobalChat).sort(), Object.keys(en.GlobalChat).sort());
  assert.deepEqual(Object.keys(es.MessagesPage).sort(), Object.keys(en.MessagesPage).sort());
  assert.deepEqual(Object.keys(es.AdminChat).sort(), Object.keys(en.AdminChat).sort());
});
