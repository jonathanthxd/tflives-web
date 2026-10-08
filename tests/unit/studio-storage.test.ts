import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_COMPOSITION, BACKGROUND_CAPABILITIES, boundedNumber, sanitizeComposition, sanitizeBackgroundSettings } from "../../src/shared/studio/appearance";
import { STUDIO_STORAGE_KEY } from "../../src/shared/studio/config";
import { STUDIO_V2_STORAGE_KEY, readStudioStorage, persistStudioStorage, sanitizeStudioStorage, presetName, MAX_USER_PRESETS } from "../../src/shared/studio/storage";

function memoryStorage() {
  const values = new Map<string, string>();
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}
test("Studio v1 migration keeps original data and all historical identity selections", () => {
  const storage = memoryStorage();
  const old = JSON.stringify({ accent: "rose", font: "vt323", background: "ghost-fibers", cursor: "system" });
  storage.setItem(STUDIO_STORAGE_KEY, old);
  const migrated = readStudioStorage(storage);
  assert.equal(migrated.preferences.font, "vt323");
  assert.equal(migrated.preferences.background, "ghost-fibers");
  assert.equal(migrated.preferences.accent, "rose");
  assert.deepEqual(migrated.preferences.composition, DEFAULT_COMPOSITION);
  assert.equal(persistStudioStorage(storage, migrated), true);
  assert.equal(storage.getItem(STUDIO_STORAGE_KEY), old);
  assert.deepEqual(readStudioStorage(storage), migrated);
});
test("Corrupted/newer storage falls back to valid legacy data without destroying it", () => {
  const storage = memoryStorage();
  storage.setItem(STUDIO_STORAGE_KEY, JSON.stringify({ font: "pixelify" }));
  for (const value of ["{", JSON.stringify({ version: 999, preferences: {} }), JSON.stringify({ version: 2, preferences: [] })]) {
    storage.setItem(STUDIO_V2_STORAGE_KEY, value);
    assert.equal(readStudioStorage(storage).preferences.font, "pixelify");
  }
});
test("Storage failures preserve tab personalization and never report a successful write", () => {
  const inaccessible = { getItem() { throw new Error("SecurityError"); }, setItem() { throw new Error("QuotaExceeded"); } };
  const value = readStudioStorage(inaccessible);
  assert.equal(persistStudioStorage(inaccessible, value), false);
  const silentlyRejected = { getItem() { return null; }, setItem() {} };
  assert.equal(persistStudioStorage(silentlyRejected, value), false);
});
test("Composition and each engine reject nonfinite, unknown and arbitrary CSS inputs", () => {
  assert.deepEqual(sanitizeComposition({ blur: -1, darken: 100, brightness: Number.NaN, saturation: "url(x)", opacity: 0 }), {
    blur: 0, darken: 0.8, brightness: 1, saturation: 1, vignette: 0, opacity: 0.1,
  });
  const settings = sanitizeBackgroundSettings({ silk: { speed: 500, rotation: "javascript:x", unknown: 1 }, bogus: { speed: 1 } });
  assert.equal(settings.silk?.speed, 10);
  assert.equal(settings.silk?.rotation, 0);
  assert.equal(settings.silk?.unknown, undefined);
  assert.equal(Object.keys(settings).length, 1);
  assert.equal(Object.keys(BACKGROUND_CAPABILITIES).length, 7);
});
test("Personal preset names, count, IDs, themes and nested preferences are bounded", () => {
  assert.equal(presetName("   Mi   noche  "), "Mi noche");
  for (const value of ["", "<script>", "x".repeat(41), "bad\u0000name"]) assert.equal(presetName(value), null);
  const storage = memoryStorage();
  const initial = readStudioStorage(storage);
  const result = sanitizeStudioStorage({ ...initial, presets: Array.from({ length: 30 }, (_, index) => ({ id: `preset-${index}`, name: "Noche", theme: "dark", preferences: { font: "not-a-font" } })) });
  assert.equal(result?.presets.length, MAX_USER_PRESETS);
  assert.equal(result?.presets[0].preferences.font, "tfl");
  assert.equal(sanitizeStudioStorage({ ...initial, presets: [{ id: "../bad", name: "Safe", theme: "dark" }] })?.presets.length, 0);
});
test("Every renderer default survives validation without changing the v0.18 appearance", () => {
  for (const controls of Object.values(BACKGROUND_CAPABILITIES)) for (const control of controls) {
    assert.equal(boundedNumber(control.default, control), control.default, control.key);
  }
});
