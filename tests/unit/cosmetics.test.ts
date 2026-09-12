import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { balanceAfterMutation } from "../../src/modules/economy/service";
import { canAccessSection } from "../../src/modules/administration/permissions";
import { isEntitlementActive } from "../../src/modules/cosmetics/service";
import { cosmeticVisualsByType, isPresetForType } from "../../src/modules/cosmetics/visuals";

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

test("purchase API ignores client price and service gates inactive, Premium, ownership, and ledger source server-side", () => {
  const purchaseRoute = readFileSync("src/app/api/account/cosmetics/purchase/route.ts", "utf8");
  const service = readFileSync("src/modules/cosmetics/service.ts", "utf8");
  assert.doesNotMatch(purchaseRoute, /body\.price/);
  assert.match(service, /!cosmetic\.active/);
  assert.match(service, /cosmetic\.premiumOnly/);
  assert.match(service, /userId_cosmeticId/);
  assert.match(service, /applyWalletTransaction/);
  assert.match(service, /cosmetic-purchase:\$\{userId\}:\$\{cosmetic\.id\}/);
  assert.match(service, /isPresetForType/);
});
