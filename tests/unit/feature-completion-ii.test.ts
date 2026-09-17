import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCosmeticInput } from "../../src/modules/cosmetics/service";
import { balanceAfterMutation } from "../../src/modules/economy/service";
import { getNotificationHref } from "../../src/modules/notifications/links";
import { targetInput, friendResponseInput, privacyInput } from "../../src/modules/social/validation";

test("cosmetic creation rejects incomplete data and string booleans, and accepts free items", () => {
  const valid = { slug: "free-frame", type: "AVATAR_FRAME" as const, rarity: "COMMON" as const, name: "Marco", nameEn: "Frame", description: "Gratis", descriptionEn: "Free", price: 0, visualPreset: "BRONZE_FRAME" as const };
  assert.throws(() => normalizeCosmeticInput({}), /campos/);
  assert.throws(() => normalizeCosmeticInput(null as never), /inválidos/);
  assert.throws(() => normalizeCosmeticInput({ ...valid, active: "false" as never }), /inválido/);
  const item = normalizeCosmeticInput(valid);
  assert.equal(item.price, 0); assert.equal(item.active, true); assert.equal(item.premiumOnly, false);
  assert.equal(normalizeCosmeticInput({ active: false }, item).active, false);
});
test("wallet cannot overflow PostgreSQL integer storage or silently lose precision", () => {
  assert.equal(balanceAfterMutation(2147483646, 1), 2147483647);
  assert.throws(() => balanceAfterMutation(2147483647, 1));
  assert.throws(() => balanceAfterMutation(10, Number.MAX_SAFE_INTEGER));
});
test("notifications route to the actual conversation, profile achievement section and security", () => {
  assert.equal(getNotificationHref({ type: "MESSAGE", entityType: "DirectMessage", entityId: "msg", conversationId: "thread" }), "/mensajes?c=thread");
  assert.equal(getNotificationHref({ type: "ACHIEVEMENT", recipientUsername: "member" }), "/perfil/member#achievements");
  assert.equal(getNotificationHref({ type: "SECURITY_ALERT" }), "/configuracion#security");
  assert.equal(getNotificationHref({ type: "ANNOUNCEMENT" }), null);
});
test("social APIs reject null, forged properties and invalid settings before database calls", () => {
  for (const input of [null, [], { username: 123 }, { username: "member", role: "ADMIN" }]) assert.equal(targetInput.safeParse(input).success, false);
  assert.equal(targetInput.parse({ username: " MEMBER " }).username, "member");
  assert.equal(friendResponseInput.safeParse({ friendshipId: {}, action: "accept" }).success, false);
  for (const input of [null, {}, { allowFriendRequests: "false" }, { friendsListVisibility: "EVERYONE" }]) assert.equal(privacyInput.safeParse(input).success, false);
  assert.deepEqual(privacyInput.parse({ allowFriendRequests: false }), { allowFriendRequests: false });
});
