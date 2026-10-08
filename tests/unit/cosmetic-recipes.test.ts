import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { COSMETIC_PRESETS, isVisualPreset } from "../../src/modules/cosmetics/visuals";
import { avatarFrameRecipe, cosmeticRecipe } from "../../src/modules/cosmetics/recipes";
import { CosmeticAvatarFrame } from "../../src/modules/cosmetics/components/cosmetic-renderer";

test("Recipe allowlists reject inherited keys and arbitrary runtime code", () => {
  for (const key of ["__proto__", "constructor", "toString", "<script>", "url(x)", "unknown"]) {
    assert.equal(isVisualPreset(key), false);
    assert.equal(cosmeticRecipe(key), null);
    assert.equal(avatarFrameRecipe(key), null);
  }
  assert.equal(avatarFrameRecipe("AURORA_ACCENT"), null);
});
test("Every frame preserves its original semantic detail count, variant, palette and layer order", () => {
  const originalCounts = { metal: 6, mono: 6, wave: 9, pulse: 6, frost: 9, circuit: 10, flame: 10, toxic: 10, prism: 10, grid: 9, petal: 18, void: 9, flare: 10, royal: 10, nebula: 10, galaxy: 10 };
  let frames = 0;
  for (const [preset, definition] of Object.entries(COSMETIC_PRESETS)) {
    const recipe = avatarFrameRecipe(preset);
    if (definition.type !== "AVATAR_FRAME") { assert.equal(recipe, null); continue; }
    frames += 1;
    assert.ok(recipe);
    assert.equal(recipe.cssVariant, definition.variant);
    assert.deepEqual(recipe.colors, definition.colors);
    assert.equal(recipe.details, originalCounts[definition.variant as keyof typeof originalCounts]);
    const html = renderToStaticMarkup(createElement(CosmeticAvatarFrame, { preset: recipe.preset }, createElement("span", null, "Portrait")));
    assert.equal((html.match(/class="cosmetic-avatar-frame__piece /g) ?? []).length, recipe.details);
    const layers = ["aura", "motif", "signature", "orbit", "particles", "ambient", "ornament", "details"];
    let previous = -1;
    for (const layer of layers) { const position = html.indexOf(`class="cosmetic-avatar-frame__${layer}"`); assert.ok(position > previous); previous = position; }
    assert.ok(html.includes(`data-variant="${definition.variant}"`));
    assert.ok(html.includes("Portrait"));
  }
  assert.equal(frames, 16);
  assert.notEqual(avatarFrameRecipe("SAKURA_FRAME")?.motion, avatarFrameRecipe("INFERNO_FRAME")?.motion);
});
