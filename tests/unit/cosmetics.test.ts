import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { balanceAfterMutation } from "../../src/modules/economy/service";
import { canAccessSection } from "../../src/modules/administration/permissions";
import { isEntitlementActive } from "../../src/modules/cosmetics/service";
import { COSMETIC_PRESETS, cosmeticVisualsByType, isPresetForType } from "../../src/modules/cosmetics/visuals";

const MIGRATIONS = [
  "20260909000000_baseline",
  "20260909010000_network_content_core",
  "20260910000000_community_realtime",
  "20260911000000_accounts_security_permissions",
  "20260912000000_profiles_identity",
  "20260913000000_progression_achievements",
  "20260914000000_obtainable_achievements",
  "20260915000000_team_member_identity",
  "20260915000000_tfl_economy",
];

async function migratedDatabase() {
  const db = await PGlite.create();
  for (const migration of MIGRATIONS) {
    await db.exec(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  }
  return db;
}

test("v0.8 additive migration preserves v0.7 data and creates the cosmetic tables", async () => {
  const db = await migratedDatabase();
  try {
    await db.exec(`INSERT INTO "User" (id,email,name,"updatedAt") VALUES ('member','member@example.test','Member',now());
      INSERT INTO "Wallet" (id,"userId",balance,"updatedAt") VALUES ('wallet','member',40,now());`);
    await db.exec(readFileSync("prisma/migrations/20260916000000_cosmetics_premium/migration.sql", "utf8"));
    const [user, wallet, cosmeticTable] = await Promise.all([
      db.query<{ id: string }>(`SELECT id FROM "User" WHERE id = 'member'`),
      db.query<{ balance: number }>(`SELECT balance FROM "Wallet" WHERE id = 'wallet'`),
      db.query<{ table_name: string }>(`SELECT table_name FROM information_schema.tables WHERE table_name = 'Cosmetic'`),
    ]);
    assert.equal(user.rows[0]?.id, "member");
    assert.equal(wallet.rows[0]?.balance, 40);
    assert.equal(cosmeticTable.rows[0]?.table_name, "Cosmetic");
  } finally {
    await db.close();
  }
});

test("successful cosmetic purchase debits once, writes one ledger row, and creates one owner", async () => {
  const db = await migratedDatabase();
  try {
    await db.exec(readFileSync("prisma/migrations/20260916000000_cosmetics_premium/migration.sql", "utf8"));
    await db.exec(`INSERT INTO "User" (id,email,name,"updatedAt") VALUES ('buyer','buyer@example.test','Buyer',now());
      INSERT INTO "Wallet" (id,"userId",balance,"updatedAt") VALUES ('buyer-wallet','buyer',300,now());
      INSERT INTO "Cosmetic" (id,slug,type,rarity,name,description,name_en,description_en,price,"visualPreset","updatedAt") VALUES ('frame','bronze-frame','AVATAR_FRAME','COMMON','Marco Bronce','Marco','Bronze Frame','Frame',100,'BRONZE_FRAME',now());
      BEGIN;
      INSERT INTO "WalletTransaction" (id,"walletId",type,source,amount,"balanceAfter","sourceKey",description) VALUES ('purchase-ledger','buyer-wallet','SPEND','FUTURE',-100,200,'cosmetic-purchase:buyer:frame','Cosmético · Marco Bronce');
      UPDATE "Wallet" SET balance = 200 WHERE id = 'buyer-wallet';
      INSERT INTO "UserCosmetic" (user_id,cosmetic_id) VALUES ('buyer','frame');
      COMMIT;`);
    const [wallet, ledger, ownership] = await Promise.all([
      db.query<{ balance: number }>(`SELECT balance FROM "Wallet" WHERE id = 'buyer-wallet'`),
      db.query<{ amount: number; balanceAfter: number; description: string }>(`SELECT amount,"balanceAfter",description FROM "WalletTransaction" WHERE id = 'purchase-ledger'`),
      db.query<{ count: number }>(`SELECT count(*)::int AS count FROM "UserCosmetic" WHERE user_id = 'buyer' AND cosmetic_id = 'frame'`),
    ]);
    assert.equal(wallet.rows[0]?.balance, 200);
    assert.deepEqual(ledger.rows[0], { amount: -100, balanceAfter: 200, description: "Cosmético · Marco Bronce" });
    assert.equal(ownership.rows[0]?.count, 1);
    assert.throws(() => balanceAfterMutation(200, -201), /suficientes/i);
    await assert.rejects(db.exec(`INSERT INTO "WalletTransaction" (id,"walletId",type,source,amount,"balanceAfter","sourceKey") VALUES ('repeat-ledger','buyer-wallet','SPEND','FUTURE',-100,100,'cosmetic-purchase:buyer:frame')`));
  } finally {
    await db.close();
  }
});

test("inventory ownership is unique and equip atomically replaces the prior item of the same type", async () => {
  const db = await migratedDatabase();
  try {
    await db.exec(readFileSync("prisma/migrations/20260916000000_cosmetics_premium/migration.sql", "utf8"));
    await db.exec(`INSERT INTO "User" (id,email,name,"updatedAt") VALUES ('owner','owner@example.test','Owner',now());
      INSERT INTO "Cosmetic" (id,slug,type,rarity,name,description,name_en,description_en,price,"visualPreset","updatedAt") VALUES
      ('frame-one','frame-one','AVATAR_FRAME','COMMON','Uno','Uno','One','One',1,'BRONZE_FRAME',now()),
      ('frame-two','frame-two','AVATAR_FRAME','RARE','Dos','Dos','Two','Two',1,'PRISM_FRAME',now());
      INSERT INTO "UserCosmetic" (user_id,cosmetic_id) VALUES ('owner','frame-one'),('owner','frame-two');
      INSERT INTO "EquippedCosmetic" (user_id,type,cosmetic_id,updated_at) VALUES ('owner','AVATAR_FRAME','frame-one',now());
      INSERT INTO "EquippedCosmetic" (user_id,type,cosmetic_id,updated_at) VALUES ('owner','AVATAR_FRAME','frame-two',now()) ON CONFLICT (user_id,type) DO UPDATE SET cosmetic_id = EXCLUDED.cosmetic_id, updated_at = EXCLUDED.updated_at;`);
    const equipped = await db.query<{ cosmetic_id: string; count: number }>(`SELECT cosmetic_id, count(*)::int AS count FROM "EquippedCosmetic" WHERE user_id = 'owner' GROUP BY cosmetic_id`);
    assert.deepEqual(equipped.rows[0], { cosmetic_id: "frame-two", count: 1 });
    await assert.rejects(db.exec(`INSERT INTO "UserCosmetic" (user_id,cosmetic_id) VALUES ('owner','frame-two')`));
  } finally {
    await db.close();
  }
});

test("premium expiry, entitlement revocation, authorization, and safe profile presets are enforced", () => {
  const now = new Date("2026-09-12T12:00:00.000Z");
  assert.equal(isEntitlementActive({ startsAt: new Date("2026-09-01"), expiresAt: null, revokedAt: null }, now), true);
  assert.equal(isEntitlementActive({ startsAt: new Date("2026-09-01"), expiresAt: new Date("2026-09-12T11:59:59.000Z"), revokedAt: null }, now), false);
  assert.equal(isEntitlementActive({ startsAt: new Date("2026-09-01"), expiresAt: null, revokedAt: new Date("2026-09-10") }, now), false);
  assert.equal(canAccessSection("ADMIN", "cosmetics"), true);
  assert.equal(canAccessSection("MOD", "cosmetics"), false);
  assert.equal(canAccessSection("USER", "cosmetics"), false);
  assert.equal(isPresetForType("AVATAR_FRAME", "PRISM_FRAME"), true);
  assert.equal(isPresetForType("AVATAR_FRAME", "SUNSET_BANNER"), false);
  assert.deepEqual(cosmeticVisualsByType([{ type: "PROFILE_BADGE", visualPreset: "STAR_BADGE" }, { type: "PROFILE_BADGE", visualPreset: "<script>" }]), {
    PROFILE_BADGE: { type: "PROFILE_BADGE", visualPreset: "STAR_BADGE" },
  });
});

test("purchase API ignores client price, avoids persistent purchase notifications, and keeps the ledger authoritative", () => {
  const purchaseRoute = readFileSync("src/app/api/account/cosmetics/purchase/route.ts", "utf8");
  const service = readFileSync("src/modules/cosmetics/service.ts", "utf8");
  const cleanupMigration = readFileSync("prisma/migrations/20260919003000_cosmetic_store_experience/migration.sql", "utf8");
  assert.doesNotMatch(purchaseRoute, /body\.price/);
  assert.match(service, /!cosmetic\.active/);
  assert.match(service, /cosmetic\.premiumOnly/);
  assert.match(service, /userId_cosmeticId/);
  assert.match(service, /applyWalletTransaction/);
  assert.match(service, /cosmetic-purchase:\$\{userId\}:\$\{cosmetic\.id\}/);
  assert.match(service, /isPresetForType/);
  const purchaseSection = service.slice(
    service.indexOf("export async function purchaseCosmetic"),
    service.indexOf("export async function equipCosmetic"),
  );
  assert.doesNotMatch(purchaseSection, /createNotification/);
  assert.match(cleanupMigration, /DELETE FROM "Notification"/);
  assert.match(cleanupMigration, /type = 'COSMETIC'/);
});


test("avatar frames 4.0 keep sixteen semantic recipes without full-frame vinyl rotation", () => {
  const css = readFileSync("src/styles/globals.css", "utf8");
  const renderer = readFileSync("src/modules/cosmetics/components/cosmetic-renderer.tsx", "utf8");
  const frameVariants = Object.values(COSMETIC_PRESETS)
    .filter((preset) => preset.type === "AVATAR_FRAME")
    .map((preset) => preset.variant);
  const avatarCss = css.slice(
    css.indexOf("/* Avatar frames ------------------------------------------------------------ */"),
    css.indexOf("/* Profile accents ---------------------------------------------------------- */"),
  );

  assert.equal(frameVariants.length, 16);
  assert.equal(new Set(frameVariants).size, 16);
  for (const variant of frameVariants) {
    assert.match(avatarCss, new RegExp(`\\.cosmetic-avatar-frame\\[data-variant="${variant}"\\]`));
  }
  assert.doesNotMatch(avatarCss, /cosmetic-frame-spin|cosmetic-frame-petals|cosmetic-frame-orbit|cosmetic-frame-solar/);
  assert.match(renderer, /FRAME_DETAIL_COUNTS/);
  assert.match(renderer, /AvatarFrameDetails/);
  assert.match(renderer, /cosmetic-avatar-frame__signature/);
  assert.match(renderer, /cosmetic-avatar-frame__ambient/);
  assert.match(renderer, /h-32/);
  assert.match(renderer, /size-16/);
  assert.match(renderer, /cosmetic-avatar-frame__piece--/);
  assert.match(renderer, /petal: 18/);
  assert.match(css, /tfl-frame-petal-fall-a/);
  assert.match(css, /tfl-frame-flame-tongue/);
  assert.match(css, /tfl-frame-circuit-node/);
  assert.match(css, /tfl-frame-toxic-drip/);
  assert.match(css, /tfl-frame-galaxy-planet/);
  assert.match(css, /tfl-frame-branch-sway/);
  assert.match(css, /tfl-frame-prism-shard/);
  assert.match(css, /tfl-frame-galaxy-satellite/);
  assert.match(css, /Avatar Frames 4\.0: next-level silhouette/);
  assert.match(renderer, /CosmeticAvatarFrame preset=\{preset\} className="translate-y-1 scale-\[1\.06\]"/);
});

test("production cosmetics expose eighty safe recipes across all five visual types", () => {
  const entries = Object.entries(COSMETIC_PRESETS);
  assert.equal(entries.length, 80);
  const counts = entries.reduce<Record<string, number>>((result, [, preset]) => {
    result[preset.type] = (result[preset.type] || 0) + 1;
    return result;
  }, {});
  assert.deepEqual(counts, {
    AVATAR_FRAME: 16,
    PROFILE_ACCENT: 16,
    PROFILE_BADGE: 16,
    NAMEPLATE: 16,
    BANNER_STYLE: 16,
  });
  for (const [key, preset] of entries) {
    assert.equal(isPresetForType(preset.type, key), true);
    assert.equal(preset.colors.length, 3);
    assert.ok(preset.preview.startsWith("linear-gradient"));
  }
});

test("production catalogue migrations safely add enum values before seeding eighty official cosmetics", async () => {
  const db = await migratedDatabase();
  try {
    await db.exec(readFileSync("prisma/migrations/20260916000000_cosmetics_premium/migration.sql", "utf8"));
    await db.exec(readFileSync("prisma/migrations/20260919000000_cosmetics_visual_system/migration.sql", "utf8"));
    await db.exec(readFileSync("prisma/migrations/20260919001000_production_cosmetics_catalog/migration.sql", "utf8"));
    const result = await db.query<{ count: number; types: number }>(`SELECT count(*)::int AS count, count(DISTINCT type)::int AS types FROM "Cosmetic" WHERE id LIKE 'official-cosmetic-%'`);
    assert.equal(result.rows[0]?.count, 80);
    assert.equal(result.rows[0]?.types, 5);
  } finally {
    await db.close();
  }
});

test("final production cosmetic reconciliation removes test rows and normalizes all eighty purchasable items", async () => {
  const db = await migratedDatabase();
  try {
    await db.exec(readFileSync("prisma/migrations/20260916000000_cosmetics_premium/migration.sql", "utf8"));
    await db.exec(readFileSync("prisma/migrations/20260919000000_cosmetics_visual_system/migration.sql", "utf8"));
    await db.exec(readFileSync("prisma/migrations/20260919001000_production_cosmetics_catalog/migration.sql", "utf8"));

    await db.exec(`
      INSERT INTO "User" (id,email,name,"updatedAt") VALUES ('legacy-owner','legacy-owner@example.test','Legacy Owner',now());
      UPDATE "Cosmetic" SET name = 'xd random', name_en = 'random xd', price = 1, active = false WHERE slug = 'bronze-frame';
      INSERT INTO "Cosmetic" (id,slug,type,rarity,name,description,name_en,description_en,price,"visualPreset","updatedAt")
      VALUES ('legacy-random-cosmetic','lo-que-sea-xd','AVATAR_FRAME','COMMON','jaja','test','lol','test',1,'BRONZE_FRAME',now());
      INSERT INTO "UserCosmetic" (user_id,cosmetic_id,source) VALUES ('legacy-owner','legacy-random-cosmetic','ADMIN_GRANT');
      INSERT INTO "EquippedCosmetic" (user_id,type,cosmetic_id,updated_at) VALUES ('legacy-owner','AVATAR_FRAME','legacy-random-cosmetic',now());
    `);

    await db.exec(readFileSync("prisma/migrations/20260919002000_cosmetics_catalog_finalization/migration.sql", "utf8"));

    const [summary, rarities, types, normalized, legacy, ownership, equipped] = await Promise.all([
      db.query<{ count: number; active: number; positive: number; bilingual: number; presets: number }>(`
        SELECT
          count(*)::int AS count,
          count(*) FILTER (WHERE active)::int AS active,
          count(*) FILTER (WHERE price > 0)::int AS positive,
          count(*) FILTER (WHERE length(trim(name)) > 0 AND length(trim(name_en)) > 0 AND length(trim(description)) > 0 AND length(trim(description_en)) > 0)::int AS bilingual,
          count(DISTINCT "visualPreset")::int AS presets
        FROM "Cosmetic"
      `),
      db.query<{ rarity: string; count: number }>(`SELECT rarity::text AS rarity, count(*)::int AS count FROM "Cosmetic" GROUP BY rarity ORDER BY rarity`),
      db.query<{ type: string; count: number }>(`SELECT type::text AS type, count(*)::int AS count FROM "Cosmetic" GROUP BY type ORDER BY type`),
      db.query<{ name: string; name_en: string; price: number; active: boolean }>(`SELECT name,name_en,price,active FROM "Cosmetic" WHERE slug = 'bronze-frame'`),
      db.query<{ count: number }>(`SELECT count(*)::int AS count FROM "Cosmetic" WHERE slug = 'lo-que-sea-xd'`),
      db.query<{ cosmetic_id: string; source: string }>(`
        SELECT uc.cosmetic_id, uc.source::text AS source
        FROM "UserCosmetic" uc
        JOIN "Cosmetic" c ON c.id = uc.cosmetic_id
        WHERE uc.user_id = 'legacy-owner' AND c.slug = 'bronze-frame'
      `),
      db.query<{ slug: string }>(`
        SELECT c.slug
        FROM "EquippedCosmetic" e
        JOIN "Cosmetic" c ON c.id = e.cosmetic_id
        WHERE e.user_id = 'legacy-owner' AND e.type = 'AVATAR_FRAME'
      `),
    ]);

    assert.deepEqual(summary.rows[0], { count: 80, active: 80, positive: 80, bilingual: 80, presets: 80 });
    assert.deepEqual(rarities.rows.map((row) => row.count).sort((a, b) => a - b), [20, 20, 20, 20]);
    assert.deepEqual(types.rows.map((row) => row.count).sort((a, b) => a - b), [16, 16, 16, 16, 16]);
    assert.deepEqual(normalized.rows[0], { name: "Bronce Forjado", name_en: "Forged Bronze", price: 150, active: true });
    assert.equal(legacy.rows[0]?.count, 0);
    assert.equal(ownership.rows[0]?.source, "ADMIN_GRANT");
    assert.equal(equipped.rows[0]?.slug, "bronze-frame");
  } finally {
    await db.close();
  }
});

test("cosmetic storefront uses horizontal category shelves and nameplates expose dedicated micro-effects", () => {
  const catalog = readFileSync("src/modules/cosmetics/components/cosmetics-catalog.tsx", "utf8");
  const renderer = readFileSync("src/modules/cosmetics/components/cosmetic-renderer.tsx", "utf8");
  const css = readFileSync("src/styles/globals.css", "utf8");
  assert.match(catalog, /cosmetics-shelf-track/);
  assert.match(catalog, /scrollBy/);
  assert.doesNotMatch(catalog, /setType\(/);
  assert.match(renderer, /cosmetic-nameplate__microfx/);
  assert.match(css, /cosmetic-nameplate-matrix-rain/);
  assert.match(css, /data-variant="matrix"/);
});

test("production cosmetic fixture contains one finalized bilingual commercial entry per visual preset", () => {
  const catalogue = JSON.parse(readFileSync("tests/fixtures/production-cosmetics.json", "utf8")) as Array<{
    key: string; slug: string; type: string; rarity: string; name_es: string; name_en: string; price: number; premium: boolean;
  }>;
  assert.equal(catalogue.length, 80);
  assert.equal(new Set(catalogue.map((item) => item.key)).size, 80);
  assert.equal(new Set(catalogue.map((item) => item.slug)).size, 80);
  assert.equal(catalogue.filter((item) => item.premium).length, 10);
  for (const item of catalogue) {
    assert.ok(item.name_es.trim().length > 0);
    assert.ok(item.name_en.trim().length > 0);
    assert.ok(item.price > 0);
  }
});


test("sakura ornaments are free from circular clipping and profile hero allows frame overflow", () => {
  const css = readFileSync("src/styles/globals.css", "utf8");
  const renderer = readFileSync("src/modules/cosmetics/components/cosmetic-renderer.tsx", "utf8");
  const profile = readFileSync("src/modules/profiles/components/profile-view.tsx", "utf8");
  const sakuraStart = css.indexOf('/* 11 — Sakura:');
  const sakuraEnd = css.indexOf('/* 12 — Void:', sakuraStart);
  const sakuraCss = css.slice(sakuraStart, sakuraEnd);

  assert.match(css, /\.cosmetic-avatar-frame \{[\s\S]*overflow: visible/);
  assert.match(css, /\.cosmetic-avatar-frame__details \{[\s\S]*overflow: visible/);
  assert.match(sakuraCss, /cosmetic-avatar-frame__piece--1/);
  assert.match(sakuraCss, /border-top: 3px solid #9f5f55/);
  assert.match(sakuraCss, /tfl-frame-petal-fall-a/);
  assert.match(sakuraCss, /tfl-frame-petal-fall-b/);
  assert.match(sakuraCss, /tfl-frame-petal-fall-c/);
  assert.match(renderer, /petal: 18/);
  assert.match(css, /data-variant="petal"\] \.cosmetic-avatar-frame__ornament/);
  assert.match(css, /cosmetic-avatar-frame__piece--18/);
  assert.match(css, /tfl-frame-petal-cross-a/);
  assert.match(css, /tfl-frame-petal-cross-b/);
  assert.match(css, /tfl-frame-petal-cross-c/);
  assert.match(css, /tfl-frame-branch-sway-lower/);
  assert.doesNotMatch(sakuraCss, /animation:\s*cosmetic-frame-spin|animation:\s*cosmetic-frame-petals/);
  assert.match(profile, /data-profile-hero className="overflow-visible/);
  assert.match(profile, /relative h-44 overflow-hidden rounded-t-3xl/);
});

test("public team cards reuse equipped cosmetic renderers instead of duplicating visuals", () => {
  const team = readFileSync("src/modules/network/components/public-content.tsx", "utf8");
  const css = readFileSync("src/styles/globals.css", "utf8");

  assert.match(team, /equippedCosmetics/);
  assert.match(team, /premiumEntitlements/);
  assert.match(team, /isEntitlementActive/);
  assert.match(team, /cosmeticVisualsByType/);
  assert.match(team, /CosmeticAvatarFrame/);
  assert.match(team, /CosmeticNameplate/);
  assert.match(team, /CosmeticBadge/);
  assert.match(team, /CosmeticBannerLayer/);
  assert.match(team, /CosmeticAccentLayer/);
  assert.match(team, /cosmeticAccentProps/);
  assert.match(css, /\.team-cosmetic-card/);
  assert.match(css, /\.team-cosmetic-card__surface \.cosmetic-profile-atmosphere/);
});

test("light mode keeps pale cosmetics legible without changing the dark recipes", () => {
  const css = readFileSync("src/styles/globals.css", "utf8");
  const lightSection = css.slice(
    css.indexOf("/* Light-mode cosmetic contrast"),
    css.indexOf("/* Cosmetics catalogue shelves"),
  );

  assert.match(lightSection, /:root:not\(\.dark\) \.cosmetic-nameplate/);
  assert.match(lightSection, /:root:not\(\.dark\) \.cosmetic-nameplate\[data-variant="soft"\]/);
  assert.match(lightSection, /:root:not\(\.dark\) \.cosmetic-nameplate\[data-variant="frost"\]/);
  assert.match(lightSection, /:root:not\(\.dark\) \.cosmetic-nameplate\[data-variant="holo"\]/);
  assert.match(lightSection, /:root:not\(\.dark\) \.cosmetic-profile-badge/);
  assert.match(lightSection, /:root:not\(\.dark\) \.cosmetic-avatar-frame\[data-variant="petal"\]::before/);
  assert.match(lightSection, /:root:not\(\.dark\) \.cosmetic-profile-atmosphere/);
  assert.match(lightSection, /:root:not\(\.dark\) \.cosmetic-banner-layer/);
  assert.match(lightSection, /var\(--cosmetic-3\)/);
  assert.doesNotMatch(lightSection, /prefers-reduced-motion|motion-reduce|deviceMemory|hardwareConcurrency|saveData|low-power/i);
});

test("chat surfaces keep avatar cosmetics compact while direct messages use Discord-like flat rows", () => {
  const profiles = readFileSync("src/modules/profiles/service.ts", "utf8");
  const globalService = readFileSync("src/modules/chat/service.ts", "utf8");
  const globalChat = readFileSync("src/modules/chat/components/global-chat.tsx", "utf8");
  const messagingService = readFileSync("src/modules/messaging/service.ts", "utf8");
  const messagesPage = readFileSync("src/app/[locale]/(platform)/mensajes/page.tsx", "utf8");
  const renderer = readFileSync("src/modules/cosmetics/components/cosmetic-renderer.tsx", "utf8");
  const css = readFileSync("src/styles/globals.css", "utf8");

  assert.match(profiles, /publicIdentityWithCosmeticsSelect/);
  assert.match(profiles, /toPublicIdentityWithCosmetics/);
  assert.match(profiles, /isEntitlementActive/);
  assert.match(globalService, /toPublicIdentityWithCosmetics/);
  assert.match(globalChat, /CosmeticAvatarFrame/);
  assert.match(globalChat, /cosmetic-avatar-frame--global-chat/);
  assert.match(globalChat, /tfl-chat-avatar-frame/);
  assert.match(globalChat, /size-7/);
  assert.match(globalChat, /tfl-global-message-row/);
  assert.match(globalChat, /messages\.map\(\(message, index\)/);
  assert.match(globalChat, /cosmeticVisualsByType/);
  assert.match(messagingService, /publicIdentityWithCosmeticsSelect/);
  assert.match(messagingService, /toPublicIdentityWithCosmetics/);
  assert.match(messagesPage, /CosmeticAvatarFrame/);
  assert.match(messagesPage, /tfl-chat-avatar-frame/);
  assert.match(messagesPage, /tfl-messaging-avatar/);
  assert.match(messagesPage, /tfl-message-row/);
  assert.match(messagesPage, /grid-cols-\[44px_minmax\(0,1fr\)\]/);
  assert.doesNotMatch(messagesPage, /CosmeticMessageFrame|messageBannerPreset/);
  assert.match(messagesPage, /grid-cols-\[300px_minmax\(0,1fr\)\]/);
  assert.doesNotMatch(renderer, /export function CosmeticMessageFrame/);
  assert.match(css, /\.tfl-chat-avatar-frame/);
  assert.match(css, /\.tfl-global-message-row/);
  assert.match(css, /\.tfl-messaging-avatar/);
  assert.match(css, /animation-play-state: paused/);
  assert.match(css, /\.tfl-message-row/);
  assert.match(css, /\.tfl-messages-shell/);
  assert.doesNotMatch(css.slice(css.indexOf("\/\* Messaging cosmetics"), css.indexOf("\/\* Light-mode cosmetic contrast")), /prefers-reduced-motion|motion-reduce|deviceMemory|hardwareConcurrency|saveData|low-power/i);
});
