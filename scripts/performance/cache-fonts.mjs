import { createRequire } from "node:module";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const require = createRequire(resolve("package.json"));
const {
  getFontAxes,
} = require("next/dist/compiled/@next/font/dist/google/get-font-axes");
const {
  getGoogleFontsUrl,
} = require("next/dist/compiled/@next/font/dist/google/get-google-fonts-url");
const fonts = [
  ["Inter", ["variable"]],
  ["Space Grotesk", ["400", "500", "600", "700"]],
  ["JetBrains Mono", ["400", "500", "600"]],
  ["Nunito", ["400", "500", "600", "700", "800"]],
  ["VT323", ["400"]],
  ["Outfit", ["400", "500", "600", "700", "800"]],
  ["Fredoka", ["400", "500", "600", "700"]],
  ["Pixelify Sans", ["400", "500", "600", "700"]],
  ["Chakra Petch", ["400", "500", "600", "700"]],
  ["Quicksand", ["400", "500", "600", "700"]],
  ["Rubik", ["400", "500", "600", "700", "800"]],
];
const dir = resolve(
  process.env.TFL_FONT_CACHE_DIR || "performance-artifacts/font-cache",
);
mkdirSync(dir, { recursive: true });
const responses = {},
  inventory = [];
const files = new Map();
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
};
for (const [family, weights] of fonts) {
  const url = getGoogleFontsUrl(
    family,
    getFontAxes(family, weights, ["normal"]),
    "swap",
  );
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30000),
  });
  assert.ok(response.ok, `Google CSS: ${family}`);
  const css = await response.text();
  for (const match of css.matchAll(
    /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g,
  )) {
    const fontUrl = match[1];
    if (!files.has(fontUrl)) {
      const download = await fetch(fontUrl, {
        headers,
        signal: AbortSignal.timeout(30000),
      });
      assert.ok(download.ok);
      const bytes = Buffer.from(await download.arrayBuffer());
      assert.equal(
        bytes.subarray(0, 4).toString(),
        "wOF2",
        "Real WOFF2 font required",
      );
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      const path = resolve(dir, sha256 + ".woff2");
      writeFileSync(path, bytes);
      files.set(fontUrl, path.replaceAll("\\", "/").replace(/^[A-Za-z]:/, ""));
      inventory.push({ family, url: fontUrl, sha256, bytes: bytes.length });
    }
  }
  assert.ok(css.includes("format('woff2')") || css.includes('format("woff2")'));
  // Preserve the exact CSS. The cached builder maps these URLs to a local
  // server which serves the original WOFF2 bytes (never synthetic fonts).
  responses[url] = css;
  console.log("Cached real Google font:", family);
}
writeFileSync(
  resolve(dir, "responses.cjs"),
  "module.exports = " + JSON.stringify(responses, null, 2) + ";\n",
);
writeFileSync(
  resolve(dir, "inventory.json"),
  JSON.stringify(inventory, null, 2),
);
console.log("Cached font files:", files.size);
