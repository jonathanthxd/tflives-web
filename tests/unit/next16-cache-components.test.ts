import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

function filesUnder(path: string): string[] {
  const absolute = join(root, path);
  return readdirSync(absolute).flatMap((entry) => {
    const child = join(absolute, entry);
    if (statSync(child).isDirectory()) {
      return filesUnder(relative(root, child));
    }
    return [relative(root, child).replaceAll("\\", "/")];
  });
}

test("Next 16 performance flags enable Cache Components and partial prefetching", () => {
  const config = read("next.config.ts");
  assert.match(config, /cacheComponents:\s*true/);
  assert.match(config, /partialPrefetching:\s*true/);
  assert.doesNotMatch(config, /reactCompiler:\s*true/);
});

test("Cache Components migration removes legacy route segment configs", () => {
  const routeFiles = filesUnder("src/app").filter((path) => /\.(?:ts|tsx)$/.test(path));
  const legacy = /^export const (?:dynamic|revalidate|fetchCache|dynamicParams|runtime)\b/m;
  const offenders = routeFiles.filter((path) => legacy.test(read(path)));
  assert.deepEqual(offenders, []);
});

test("private and administration surfaces remain allowed to block during gradual adoption", () => {
  for (const path of [
    "src/app/[locale]/(administration)/layout.tsx",
    "src/app/[locale]/(administration)/admin/page.tsx",
    "src/app/[locale]/(platform)/cosmeticos/page.tsx",
  ]) {
    assert.match(read(path), /export const instant = false;/, path);
  }
});

test("Home, Network and Wiki opt into Suspense-driven instant navigation", () => {
  for (const path of [
    "src/app/[locale]/(marketing)/page.tsx",
    "src/app/[locale]/(marketing)/network/page.tsx",
    "src/app/[locale]/(marketing)/network/wiki/page.tsx",
  ]) {
    const source = read(path);
    assert.doesNotMatch(source, /export const instant = false;/, path);
    assert.match(source, /<Suspense\b/, path);
  }
});

test("public caches contain no auth, cookie, wallet, message or ownership data", () => {
  const source = read("src/modules/network/cache/public-content-cache.ts");
  assert.match(source, /"use cache"/);
  assert.match(source, /cacheLife\("minutes"\)/);
  assert.match(source, /cacheLife\("hours"\)/);
  assert.match(source, /cacheTag\(PUBLIC_CONTENT_TAGS\./);
  assert.doesNotMatch(source, /getCurrentAuthUser|cookies\(|headers\(|wallet|directMessage|equippedCosmetics|premiumEntitlement/i);
  assert.doesNotMatch(source, /prisma\.user\b/i);
});

test("editorial mutations invalidate their corresponding public cache tags", () => {
  const expectations = [
    ["src/app/api/posts/route.ts", "PUBLIC_CONTENT_TAGS.posts"],
    ["src/app/api/posts/[id]/route.ts", "PUBLIC_CONTENT_TAGS.posts"],
    ["src/app/api/modalities/route.ts", "PUBLIC_CONTENT_TAGS.modalities"],
    ["src/app/api/modalities/[id]/route.ts", "PUBLIC_CONTENT_TAGS.modalities"],
    ["src/app/api/admin/wiki/route.ts", "PUBLIC_CONTENT_TAGS.wiki"],
    ["src/app/api/admin/wiki/[id]/route.ts", "PUBLIC_CONTENT_TAGS.wiki"],
    ["src/app/api/admin/timeline/route.ts", "PUBLIC_CONTENT_TAGS.timeline"],
    ["src/app/api/admin/timeline/[id]/route.ts", "PUBLIC_CONTENT_TAGS.timeline"],
  ] as const;

  for (const [path, tag] of expectations) {
    const source = read(path);
    assert.match(source, /revalidateTag\(/, path);
    assert.ok(source.includes(tag), `${path} should invalidate ${tag}`);
  }
});
