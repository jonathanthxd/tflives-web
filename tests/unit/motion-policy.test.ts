import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function sourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|js|jsx|css)$/.test(entry) ? [path] : [];
  });
}

test("runtime never disables or downgrades motion from OS or low-resource heuristics", () => {
  const forbidden = [
    /prefers-reduced-motion/i,
    /useReducedMotion/,
    /reducedMotion/,
    /reduceMotion/,
    /motion-reduce:/,
    /motion-safe:/,
    /navigator\.connection/,
    /deviceMemory/,
    /hardwareConcurrency/,
    /saveData/,
    /effectiveType/,
    /powerPreference\s*:\s*["']low-power["']/,
  ];

  const offenders: string[] = [];
  for (const file of sourceFiles("src")) {
    const content = readFileSync(file, "utf8");
    for (const rule of forbidden) {
      if (rule.test(content)) offenders.push(`${file}: ${rule}`);
    }
  }

  assert.deepEqual(offenders, []);
});
