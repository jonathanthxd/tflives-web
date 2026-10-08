import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaClient } from "@prisma/client";
import { ImageResponse } from "next/og";
import { renderToStaticMarkup } from "react-dom/server";
import { queryPublicProfileCard, cardUsername, profileCardSelect } from "../../src/modules/profiles/cards/public-card";
import { trustedAvatarUrl, avatarData, loadCardAvatar, MAX_CARD_AVATAR_BYTES } from "../../src/modules/profiles/cards/avatar";
import { profileCardElement, PROFILE_CARD_CACHE_CONTROL } from "../../src/modules/profiles/cards/image";

const MIGRATIONS = [
  "20260909000000_baseline", "20260909010000_network_content_core", "20260910000000_community_realtime",
  "20260911000000_accounts_security_permissions", "20260912000000_profiles_identity", "20260913000000_progression_achievements",
  "20260914000000_obtainable_achievements", "20260915000000_team_member_identity", "20260915000000_tfl_economy",
  "20260916000000_cosmetics_premium", "20260917000000_cleanup_enums_and_message", "20260917000000_creator_ecosystem",
  "20260918000000_analytics_observability", "20260919000000_cosmetics_visual_system", "20260919001000_production_cosmetics_catalog",
  "20260919002000_cosmetics_catalog_finalization", "20260919003000_cosmetic_store_experience",
  "20260920000000_feature_completion_ii", "20260921000000_production_hardening",
];

test("Public card projection uses real counts, aliases, active awards and no private fields", async () => {
  const db = await PGlite.create();
  const socket = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 55448, maxConnections: 2 });
  const client = new PrismaClient({ datasources: { db: { url: "postgresql://postgres:postgres@127.0.0.1:55448/postgres?connection_limit=1" } } });
  try {
    for (const migration of MIGRATIONS) await db.exec(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    await socket.start();
    for (const id of ["card_member", "card_follower", "card_zero"]) await client.user.create({ data: { id, username: id, name: id, email: `${id}@private.test` } });
    await client.usernameAlias.create({ data: { username: "old_member", userId: "card_member" } });
    await client.follow.create({ data: { followerId: "card_follower", followingId: "card_member" } });
    await client.reaction.createMany({ data: [{ userId: "card_follower", targetType: "PROFILE", targetId: "card_member" }, { userId: "card_zero", targetType: "PROFILE", targetId: "card_member" }, { userId: "card_zero", targetType: "POST", targetId: "card_member" }] });
    await client.wallet.create({ data: { userId: "card_member", balance: 987654 } });
    await client.userProgressAchievement.createMany({ data: [{ userId: "card_member", code: "FIRST" }, { userId: "card_member", code: "SECOND" }] });
    for (const active of [true, false]) {
      const award = await client.achievement.create({ data: { name: "Award", description: "Public award", iconKey: "star", createdById: "card_follower", active } });
      await client.userAchievement.create({ data: { userId: "card_member", achievementId: award.id } });
    }
    const result = await queryPublicProfileCard("CARD_MEMBER", client);
    assert.equal(result?.likes, 2); assert.equal(result?.followers, 1); assert.equal(result?.achievements, 3);
    assert.deepEqual(await queryPublicProfileCard("old_member", client), result);
    assert.equal(await queryPublicProfileCard("missing_member", client), null);
    const zero = await queryPublicProfileCard("card_zero", client);
    assert.equal(zero?.likes, 0); assert.equal(zero?.achievements, 0); assert.equal(zero?.followers, 0);
    assert.doesNotMatch(JSON.stringify(result), /private.test|987654|email|wallet|role|session/);
    assert.doesNotMatch(JSON.stringify(profileCardSelect), /wallet|email|sessions|messages|role/);
    assert.equal(await client.userAchievement.count(), 2, "reads must not reconcile or award achievements");
  } finally {
    await client.$disconnect(); await socket.stop(); await db.runExclusive(async () => {});
    await new Promise((resolve) => setImmediate(resolve)); await db.runExclusive(async () => {}); await db.close();
  }
});

test("Card usernames and external avatars reject injection, redirects and SSRF destinations", async () => {
  for (const input of [null, "../admin", "a", "a".repeat(65), "<script>"]) assert.equal(cardUsername(input), null);
  assert.equal(cardUsername(" TFL_Member "), "tfl_member");
  for (const value of ["http://127.0.0.1/avatar", "https://169.254.169.254/", "https://avatars.githubusercontent.com.evil.test/a", "https://user:pass@cdn.discordapp.com/a", "https://cdn.discordapp.com:444/a", "file:///etc/passwd", "data:image/svg+xml,<svg/>"]) assert.equal(trustedAvatarUrl(value), null);
  assert.equal(trustedAvatarUrl("https://avatars.githubusercontent.com/u/1")?.hostname, "avatars.githubusercontent.com");
  assert.equal(await loadCardAvatar("card_member", "http://127.0.0.1/avatar"), null);
  const png = readFileSync("public/icons/icon-192.png");
  assert.match(avatarData(png, "image/png")!, /^data:image\/png;base64,/);
  assert.equal(avatarData(png, "image/jpeg"), null);
  assert.equal(avatarData(new Uint8Array(MAX_CARD_AVATAR_BYTES + 1), "image/png"), null);
  const originalFetch = globalThis.fetch;
  try {
    let calls = 0;
    globalThis.fetch = async (_input, init) => { calls++; assert.equal(init?.redirect, "error"); return new Response(new Uint8Array(MAX_CARD_AVATAR_BYTES + 1), { headers: { "content-type": "image/png" } }); };
    assert.equal(await loadCardAvatar("card_member", "https://cdn.discordapp.com/avatar.png"), null);
    assert.equal(calls, 1);
    globalThis.fetch = async () => { throw new Error("timeout"); };
    assert.equal(await loadCardAvatar("card_member", "https://cdn.discordapp.com/avatar.png"), null);
  } finally { globalThis.fetch = originalFetch; }
});

test("Real ES/EN card renderer emits 1200x630 PNG, safe initials and private coins", async () => {
  const card = { username: "card_member", name: "Miembro con nombre amplio y seguro", image: null, likes: 1200000, achievements: 0, followers: 6543, cosmetics: [] };
  const brand = `data:image/png;base64,${readFileSync("public/icons/icon-192.png").toString("base64")}`;
  for (const locale of ["es", "en"] as const) {
    const element = profileCardElement(card, locale, null, brand);
    const html = renderToStaticMarkup(element);
    assert.match(html, locale === "es" ? /Privado/ : /Private/);
    assert.match(html, /card_member/);
    const bytes = Buffer.from(await new ImageResponse(element, { width: 1200, height: 630 }).arrayBuffer());
    assert.equal(bytes.readUInt32BE(16), 1200); assert.equal(bytes.readUInt32BE(20), 630);
    assert.equal(bytes.subarray(1, 4).toString(), "PNG"); assert.ok(bytes.length > 10000);
  }
  assert.match(PROFILE_CARD_CACHE_CONTROL, /s-maxage=120/);
});
