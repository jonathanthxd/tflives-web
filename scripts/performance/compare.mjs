import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [
  beforePath,
  afterPath,
  target = "performance-artifacts/comparison.json",
] = process.argv.slice(2);
assert.ok(
  beforePath && afterPath,
  "Pass baseline and candidate measurements.json paths",
);
const before = JSON.parse(readFileSync(beforePath, "utf8"));
const after = JSON.parse(readFileSync(afterPath, "utf8"));
assert.equal(before.browser, after.browser, "Browser must match");
assert.equal(before.node, after.node, "Node must match");
assert.equal(before.next, after.next, "Compiler/runtime must match");
assert.deepEqual(
  before.browserArgs,
  after.browserArgs,
  "Renderer settings must match",
);
assert.equal(
  before.results.length,
  72,
  "Baseline must contain the complete route matrix",
);
assert.equal(
  after.results.length,
  72,
  "Candidate must contain the complete route matrix",
);
const key = (row) => [row.viewport, row.locale, row.theme, row.route].join("|");
const old = new Map(before.results.map((row) => [key(row), row]));
assert.equal(old.size, after.results.length, "Route matrices must match");
const median = (values) => {
  const sorted = values.slice().sort((a, b) => a - b);
  return (
    (sorted[Math.floor((sorted.length - 1) / 2)] +
      sorted[Math.ceil((sorted.length - 1) / 2)]) /
    2
  );
};
const rows = after.results.map((row) => {
  const previous = old.get(key(row));
  assert.ok(previous, key(row));
  const metrics = {};
  for (const field of [
    "fcp",
    "lcp",
    "cls",
    "blocking",
    "ttfb",
    "mainVisibleObservedMs",
  ])
    metrics[field] = {
      before: previous[field],
      after: row[field],
      delta: row[field] - previous[field],
    };
  for (const group of ["js", "css", "fonts", "images"])
    metrics[group] = {
      before: previous[group],
      after: row[group],
      encodedByteDelta: row[group].encodedBytes - previous[group].encodedBytes,
    };
  metrics.fontPreloadHtml = {
    before: previous.fontPreloadHtml,
    after: row.fontPreloadHtml,
  };
  return { key: key(row), metrics };
});
const summary = {};
for (const field of ["fcp", "lcp", "cls", "blocking", "mainVisibleObservedMs"])
  summary[field] = {
    beforeMedian: median(before.results.map((row) => row[field])),
    afterMedian: median(after.results.map((row) => row[field])),
  };
for (const group of ["js", "css", "fonts"])
  summary[group] = {
    beforeMedianEncodedBytes: median(
      before.results.map((row) => row[group].encodedBytes),
    ),
    afterMedianEncodedBytes: median(
      after.results.map((row) => row[group].encodedBytes),
    ),
    beforeMedianCount: median(before.results.map((row) => row[group].count)),
    afterMedianCount: median(after.results.map((row) => row[group].count)),
  };
const comparison = {
  method:
    "Matched single observations, unthrottled local production builds. Timings are descriptive lab observations, not statistical proof or RUM.",
  runtime: { node: before.node, next: before.next, browser: before.browser },
  beforeBuild: before.buildId,
  afterBuild: after.buildId,
  summary,
  rows,
};
writeFileSync(resolve(target), JSON.stringify(comparison, null, 2));
console.log(JSON.stringify(summary, null, 2));
