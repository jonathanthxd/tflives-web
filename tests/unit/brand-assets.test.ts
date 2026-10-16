import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("official brand vector is available and safe to render", () => {
  const svg = readFileSync("public/brand/tflives.svg", "utf8");
  assert.match(svg, /^<svg\b[^>]*viewBox="217 239 824 824"/);
  assert.match(svg, /fill="#fdfdfd"/);
  assert.doesNotMatch(svg, /<script\b|onload\s*=|<foreignObject|(?:href|src)\s*=\s*["']https?:/i);
});

test("the shared TFLives mark is used across navigation, home, footer, login header and Studio", () => {
  const paths = [
    "src/shared/ui/layout/navbar.tsx",
    "src/shared/ui/layout/footer.tsx",
    "src/shared/ui/layout/auth-header.tsx",
    "src/app/[locale]/(marketing)/page.tsx",
    "src/shared/ui/studio/studio-editor.tsx",
  ];
  for (const path of paths) {
    assert.match(readFileSync(path, "utf8"), /<BrandMark\b/, path);
  }
});
