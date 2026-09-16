import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  STUDIO_CURSOR_PACKS,
  STUDIO_CURSOR_ROLES,
  getCursorAnimationInterval,
  getCursorCssValue,
  normalizeStudioCursor,
} from "../../src/shared/studio/cursors";

test("Studio ships a focused native glass cursor catalog", () => {
  assert.equal(STUDIO_CURSOR_PACKS.length, 5);
  assert.equal(new Set(STUDIO_CURSOR_PACKS.map((pack) => pack.id)).size, STUDIO_CURSOR_PACKS.length);
  assert.equal(STUDIO_CURSOR_PACKS[0]?.id, "system");

  for (const pack of STUDIO_CURSOR_PACKS.slice(1)) {
    assert.ok(pack.preview);
    assert.equal(existsSync(join("public", pack.preview!.replace(/^\//, ""))), true, `${pack.id} preview`);
    for (const role of STUDIO_CURSOR_ROLES) {
      const definition = pack.roles[role];
      assert.ok(definition?.frames.length, `${pack.id}:${role}`);
      assert.ok(definition?.hotspot, `${pack.id}:${role}:hotspot`);
      for (const frame of definition!.frames) {
        assert.equal(existsSync(join("public", frame.replace(/^\//, ""))), true, `${pack.id}:${role}:${frame}`);
      }
    }
  }
});

test("everyday cursor roles stay stable while status cursors animate", () => {
  const prism = STUDIO_CURSOR_PACKS.find((pack) => pack.id === "prism-glass");
  assert.ok(prism);

  const first = getCursorCssValue(prism!, "default", 0);
  const later = getCursorCssValue(prism!, "default", 500);
  assert.match(first, /default-00\.cur"\) 4 3, default/);
  assert.equal(first, later);

  const waitFirst = getCursorCssValue(prism!, "wait", 0);
  const waitLater = getCursorCssValue(prism!, "wait", 190);
  assert.notEqual(waitFirst, waitLater);
  assert.equal(getCursorAnimationInterval(prism!), 92);

  const provider = readFileSync("src/providers/studio-provider.tsx", "utf8");
  assert.match(provider, /--tfl-cursor-/);
  assert.match(provider, /visibilitychange/);
  assert.doesNotMatch(provider, /mousemove|pointermove/);
});

test("legacy cursor selections migrate to the refined material catalog", () => {
  assert.equal(normalizeStudioCursor("sakura-glass"), "prism-glass");
  assert.equal(normalizeStudioCursor("cyber-glass"), "aurora-glass");
  assert.equal(normalizeStudioCursor("mono-glass"), "frost-glass");
  assert.equal(normalizeStudioCursor("something-broken"), "system");
});

test("Windows cursor importer parses ANI RIFF frames without a runtime dependency", () => {
  const importer = readFileSync("scripts/cursors/import-windows-pack.mjs", "utf8");
  assert.match(importer, /RIFF/);
  assert.match(importer, /ACON/);
  assert.match(importer, /cur\|ani/);
  assert.match(importer, /parseAni/);
  assert.match(importer, /manifest\.json/);
});
