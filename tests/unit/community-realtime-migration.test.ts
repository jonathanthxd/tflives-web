import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("v0.3 migration is additive on the current v0.2 schema", async () => {
  const db = await PGlite.create();
  try {
    for (const migration of [
      "prisma/migrations/20260909000000_baseline/migration.sql",
      "prisma/migrations/20260909010000_network_content_core/migration.sql",
      "prisma/migrations/20260910000000_community_realtime/migration.sql",
    ]) {
      await db.exec(readFileSync(migration, "utf8"));
    }
    const tables = await db.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    );
    const names = new Set(tables.rows.map((row) => row.tablename));
    for (const table of ["ChatSticker", "DirectMessageReaction", "GlobalChatMessage", "GlobalChatReaction", "GlobalChatReadState"]) {
      assert.equal(names.has(table), true, table);
    }
    const messageColumns = await db.query<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'DirectMessage'",
    );
    const columns = new Set(messageColumns.rows.map((row) => row.column_name));
    assert.equal(columns.has("replyToId"), true);
    assert.equal(columns.has("stickerId"), true);
    assert.equal(columns.has("deletedAt"), true);
  } finally {
    await db.close();
  }
});
