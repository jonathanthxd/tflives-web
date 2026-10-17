import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("official brand vector is safe, while the UI uses the transparent PNG", () => {
  const svg = readFileSync("public/brand/tflives.svg", "utf8");
  assert.match(svg, /^<svg\b[^>]*viewBox="217 239 824 824"/);
  assert.doesNotMatch(svg, /<script\b|onload\s*=|<foreignObject|(?:href|src)\s*=\s*["']https?:/i);
  const mark = readFileSync("src/shared/ui/brand-mark.tsx", "utf8");
  assert.match(mark, /src="\/icons\/icon-192\.png"/);
  assert.doesNotMatch(mark, /bg-\[|rounded|ring-|border-|p-\[|bg-black|background:/, "The official logo must never sit in an invented tile or box");
});

test("brand mark is shared across home, navigation, footer, auth header and Studio", () => {
  for (const path of [
    "src/shared/ui/layout/navbar.tsx",
    "src/shared/ui/layout/footer.tsx",
    "src/shared/ui/layout/auth-header.tsx",
    "src/app/[locale]/(marketing)/page.tsx",
    "src/shared/ui/studio/studio-editor.tsx",
  ]) assert.match(readFileSync(path, "utf8"), /<BrandMark\b/, path);
});
