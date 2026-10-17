import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("application PNG variants have real, compatible dimensions and a bounded total size", () => {
  let total = 0;
  for (const [path, dimension] of [
    ["src/app/icon.png", 512],
    ["public/icons/icon-192.png", 192],
    ["src/app/apple-icon.png", 180],
  ] as const) {
    const bytes = readFileSync(path);
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), dimension);
    assert.equal(bytes.readUInt32BE(20), dimension);
    total += bytes.length;
  }
  assert.ok(total < 350_000, `PNG transfer budget exceeded: ${total}`);
});

test("favicon is a genuine compact ICO with legacy browser variants", () => {
  const bytes = readFileSync("src/app/favicon.ico");
  assert.equal(bytes.readUInt32LE(0), 0x00010000);
  const count = bytes.readUInt16LE(4);
  const dimensions = Array.from(
    { length: count },
    (_, index) => bytes[6 + index * 16],
  );
  assert.deepEqual(dimensions, [16, 32, 48]);
  assert.ok(bytes.length < 32_768);
});

test("PWA manifest references both required PNG sizes", () => {
  const source = readFileSync("src/app/manifest.ts", "utf8");
  assert.match(
    source,
    /src: "\/icons\/icon-192\.png", sizes: "192x192", type: "image\/png"/,
  );
  assert.match(
    source,
    /src: "\/icon\.png", sizes: "512x512", type: "image\/png"/,
  );
});
