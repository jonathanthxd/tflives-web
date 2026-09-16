import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  STUDIO_CURSOR_PACKS,
  STUDIO_CURSOR_ROLES,
  getCursorCssValue,
} from "../../src/shared/studio/cursors";

test("Studio ships a full native cursor catalog with unique packs", () => {
  assert.ok(STUDIO_CURSOR_PACKS.length >= 9);
  assert.equal(new Set(STUDIO_CURSOR_PACKS.map((pack) => pack.id)).size, STUDIO_CURSOR_PACKS.length);
  assert.equal(STUDIO_CURSOR_PACKS[0]?.id, "system");

  for (const pack of STUDIO_CURSOR_PACKS.slice(1)) {
    assert.ok(pack.preview);
    assert.equal(existsSync(join("public", pack.preview!.replace(/^\//, ""))), true, `${pack.id} preview`);
    for (const role of STUDIO_CURSOR_ROLES) {
      const definition = pack.roles[role];
      assert.ok(definition?.frames.length, `${pack.id}:${role}`);
      for (const frame of definition!.frames) {
        assert.equal(existsSync(join("public", frame.replace(/^\//, ""))), true, `${pack.id}:${role}:${frame}`);
      }
    }
  }
});

test("animated cursor CSS keeps the browser-native cursor pipeline", () => {
  const prism = STUDIO_CURSOR_PACKS.find((pack) => pack.id === "prism-glass");
  assert.ok(prism);
  const first = getCursorCssValue(prism!, "default", 0);
  const later = getCursorCssValue(prism!, "default", 100);
  assert.match(first, /url\("\/cursors\/tfl\/prism-glass\/default-00\.cur"\), default/);
  assert.notEqual(first, later);

  const provider = readFileSync("src/providers/studio-provider.tsx", "utf8");
  assert.match(provider, /--tfl-cursor-/);
  assert.match(provider, /visibilitychange/);
  assert.doesNotMatch(provider, /mousemove|pointermove/);
});

test("Windows cursor importer parses ANI RIFF frames without a runtime dependency", () => {
  const importer = readFileSync("scripts/cursors/import-windows-pack.mjs", "utf8");
  assert.match(importer, /RIFF/);
  assert.match(importer, /ACON/);
  assert.match(importer, /\.ani/);
  assert.match(importer, /manifest\.json/);
});
