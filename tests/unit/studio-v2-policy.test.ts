import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { publicProfileSelect } from "../../src/modules/profiles/service";
import { APPEARANCE_PRESETS } from "../../src/shared/studio/presets";
import { sanitizePreferences } from "../../src/shared/studio/storage";
import { backgroundControls } from "../../src/shared/studio/appearance";

test("Studio V2 and Profile Cards translations cover the same complete key tree", () => {
  const es = JSON.parse(readFileSync("messages/es.json", "utf8"));
  const en = JSON.parse(readFileSync("messages/en.json", "utf8"));
  const keys = (value: Record<string, unknown>, prefix = ""): string[] => Object.entries(value).flatMap(([key, child]) => child && typeof child === "object" ? keys(child as Record<string, unknown>, `${prefix}${key}.`) : [`${prefix}${key}`]).sort();
  for (const namespace of ["StudioV2", "ProfileCards"]) assert.deepEqual(keys(es[namespace]), keys(en[namespace]));
  assert.equal(Object.keys(es.StudioV2.accents).length, 17);
  for (const background of ["silk", "ghost-fibers", "crt-warp", "molten-metal", "gradient-waves", "prism", "line-waves"] as const) for (const control of backgroundControls(background)) assert.ok(es.StudioV2.controls[control.key]);
});

test("All eight shipped presets contain valid preferences and existing renderer IDs", () => {
  assert.equal(APPEARANCE_PRESETS.length, 8);
  assert.equal(new Set(APPEARANCE_PRESETS.map((preset) => preset.id)).size, 8);
  for (const preset of APPEARANCE_PRESETS) assert.deepEqual(sanitizePreferences(preset.preferences), preset.preferences);
});

test("Public profile HTML projection honors the existing private coin policy", () => {
  assert.equal(Object.hasOwn(publicProfileSelect, "wallet"), false);
  assert.equal(Object.hasOwn(publicProfileSelect, "email"), false);
});
