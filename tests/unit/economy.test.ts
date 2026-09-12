import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  balanceAfterMutation,
  levelCoinReward,
  validateAdminCoinAdjustment,
} from "../../src/modules/economy/service";
import { canAccessSection } from "../../src/modules/administration/permissions";

const MIGRATIONS = [
  "20260909000000_baseline",
  "20260909010000_network_content_core",
  "20260910000000_community_realtime",
  "20260911000000_accounts_security_permissions",
  "20260912000000_profiles_identity",
  "20260913000000_progression_achievements",
  "20260914000000_obtainable_achievements",
  "20260915000000_tfl_economy",
];

test("wallet migration defaults to zero and preserves a consistent, idempotent ledger", async () => {
  const db = await PGlite.create();
  try {
    for (const migration of MIGRATIONS) {
      await db.exec(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    }
    await db.exec(`INSERT INTO "User" (id,email,name,"updatedAt") VALUES ('wallet-user','wallet@example.test','Wallet User',now())`);
    await db.exec(`INSERT INTO "Wallet" (id,"userId","updatedAt") VALUES ('wallet-1','wallet-user',now())`);
    const initial = await db.query<{ balance: number }>(`SELECT balance FROM "Wallet" WHERE id = 'wallet-1'`);
    assert.equal(initial.rows[0]?.balance, 0);

    const balanceAfterCredit = balanceAfterMutation(initial.rows[0]!.balance, 25);
    await db.exec(`INSERT INTO "WalletTransaction" (id,"walletId",type,source,amount,"balanceAfter","sourceKey") VALUES ('credit-1','wallet-1','ADMIN_GRANT','ADMIN',25,25,'admin-adjustment:one'); UPDATE "Wallet" SET balance = 25 WHERE id = 'wallet-1'`);
    const ledger = await db.query<{ amount: number; balanceAfter: number }>(`SELECT amount,"balanceAfter" FROM "WalletTransaction" WHERE id = 'credit-1'`);
    assert.deepEqual(ledger.rows[0], { amount: 25, balanceAfter: balanceAfterCredit });

    assert.throws(() => balanceAfterMutation(25, -26));
    await assert.rejects(db.exec(`UPDATE "Wallet" SET balance = -1 WHERE id = 'wallet-1'`));
    await assert.rejects(db.exec(`INSERT INTO "WalletTransaction" (id,"walletId",type,source,amount,"balanceAfter","sourceKey") VALUES ('duplicate','wallet-1','ADMIN_GRANT','ADMIN',25,50,'admin-adjustment:one')`));
  } finally {
    await db.close();
  }
});

test("automatic level and achievement sources award at most once", async () => {
  assert.equal(levelCoinReward(1), 10);
  assert.equal(levelCoinReward(5), 20);
  const levelSource = "level-up:wallet-user:5";
  const achievementSource = "achievement:wallet-user:progression:LEVEL_FIVE";
  assert.notEqual(levelSource, achievementSource);
  assert.match(levelSource, /^level-up:[^:]+:\d+$/);
  assert.match(achievementSource, /^achievement:[^:]+:.+$/);

  const db = await PGlite.create();
  try {
    for (const migration of MIGRATIONS) {
      await db.exec(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    }
    await db.exec(`INSERT INTO "User" (id,email,name,"updatedAt") VALUES ('reward-user','reward@example.test','Reward User',now()); INSERT INTO "Wallet" (id,"userId","updatedAt") VALUES ('reward-wallet','reward-user',now())`);
    await db.exec(`INSERT INTO "WalletTransaction" (id,"walletId",type,source,amount,"balanceAfter","sourceKey") VALUES ('level-once','reward-wallet','LEVEL_REWARD','PROGRESSION',20,20,'level-up:reward-user:5'); INSERT INTO "WalletTransaction" (id,"walletId",type,source,amount,"balanceAfter","sourceKey") VALUES ('achievement-once','reward-wallet','ACHIEVEMENT_REWARD','ACHIEVEMENT',20,40,'achievement:reward-user:progression:LEVEL_FIVE')`);
    await assert.rejects(db.exec(`INSERT INTO "WalletTransaction" (id,"walletId",type,source,amount,"balanceAfter","sourceKey") VALUES ('level-twice','reward-wallet','LEVEL_REWARD','PROGRESSION',20,60,'level-up:reward-user:5')`));
    await assert.rejects(db.exec(`INSERT INTO "WalletTransaction" (id,"walletId",type,source,amount,"balanceAfter","sourceKey") VALUES ('achievement-twice','reward-wallet','ACHIEVEMENT_REWARD','ACHIEVEMENT',20,60,'achievement:reward-user:progression:LEVEL_FIVE')`));
  } finally {
    await db.close();
  }
});

test("wallet administration is ADMIN-only and always needs a reason", () => {
  assert.equal(canAccessSection("ADMIN", "wallet"), true);
  assert.equal(canAccessSection("MOD", "wallet"), false);
  assert.equal(canAccessSection("USER", "wallet"), false);
  assert.equal(validateAdminCoinAdjustment(10, "Community event reward"), "Community event reward");
  assert.throws(() => validateAdminCoinAdjustment(10, "   "));
  assert.throws(() => validateAdminCoinAdjustment(0, "Invalid amount"));
});

test("the public wallet route is self-scoped and exposes no mutation handler", () => {
  const route = readFileSync("src/app/api/account/wallet/route.ts", "utf8");
  assert.match(route, /getWalletSummary\(authUser\.id, limit\)/);
  assert.doesNotMatch(route, /export async function (POST|PATCH|PUT|DELETE)/);
  assert.doesNotMatch(route, /searchParams\.get\(["']userId/);
});
