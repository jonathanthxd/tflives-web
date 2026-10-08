import assert from "node:assert/strict";
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";
import { installWebGLProbe } from "./studio-checks.mjs";
import { installMetrics, captureMetrics } from "./browser-metrics.mjs";
import { observeInitialRequests } from "./readiness.mjs";

export async function checkTeam(browser, origin, output) {
  const checks = [];
  for (const width of [1440, 820, 390]) for (const theme of ["dark", "light"]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
    try {
      await context.addInitScript((theme) => localStorage.setItem("theme", theme), theme);
      await context.addInitScript(installWebGLProbe);
      await context.addInitScript(installMetrics, { theme });
      const page = await context.newPage();
      const ready = observeInitialRequests(page, origin);
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${origin}/es`, { waitUntil: "domcontentloaded" });
      // Streaming can temporarily retain a second copy in a hidden S: container.
      // Exercise the rendered main content, and keep strict uniqueness there.
      const arena = page.locator("main .team-neural__arena").filter({ visible: true });
      await arena.waitFor({ timeout: 30000 });
      await ready();
      assert.equal(await arena.count(), 1, "Exactly one rendered team arena must exist");
      const initial = await page.evaluate(captureMetrics);
      const initialArena = await arena.boundingBox();
      const initialCanvasCount = await arena.locator("canvas").count();
      const start = await page.evaluate(() => performance.now());
      await arena.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const root = [...document.querySelectorAll("main .team-neural__arena")].find((node) => node.getClientRects().length);
        const canvas = root?.querySelector(".team-neural-field canvas");
        const stats = window.__glStats.get(canvas);
        return stats?.draws > 2 && stats.times.size > 2;
      }, null, { timeout: 60000 });
      const firstSceneObservedMs = await page.evaluate((start) => performance.now() - start, start);
      await ready();
      const settled = await page.evaluate(captureMetrics);
      const selected = arena.locator(".team-neural__display-name");
      const previous = await selected.textContent();
      await arena.getByRole("button", { name: "Siguiente miembro", exact: true }).click();
      await page.waitForFunction((previous) => {
        const root = [...document.querySelectorAll("main .team-neural__arena")].find((node) => node.getClientRects().length);
        const name = root?.querySelector(".team-neural__display-name")?.textContent;
        return Boolean(name) && name !== previous;
      }, previous);
      await page.waitForTimeout(500); // Preserve and allow the existing travel transition.
      const font = await selected.evaluate((node) => getComputedStyle(node).fontSize);
      const border = await arena.evaluate((node) => getComputedStyle(node).borderRadius);
      assert.ok(parseFloat(border) > 0 && parseFloat(font) > 0, "Constellation route CSS must be applied before interaction");
      const bounds = (arena) => {
        const describe = (selector) => {
          const node = selector ? arena.querySelector(selector) : arena, box = node.getBoundingClientRect(), style = getComputedStyle(node);
          return { x: box.x, y: box.y, width: box.width, height: box.height, left: style.left, position: style.position, translate: style.translate, transform: style.transform, offsetParent: node.offsetParent?.className };
        };
        return { scrollLeft: arena.scrollLeft, scrollTop: arena.scrollTop, documentScrollX: window.scrollX,
          arena: describe(null), card: describe(".team-neural__spotlight"), navigator: describe(".team-neural__navigator") };
      };
      const boundsBefore = await arena.evaluate(bounds);
      assert.equal(boundsBefore.scrollLeft, 0, "Focusing team controls must not scroll the clipped 3D arena horizontally");
      assert.equal(boundsBefore.scrollTop, 0, "Focusing team controls must not scroll the clipped 3D arena vertically");
      for (const box of [boundsBefore.card, boundsBefore.navigator]) {
        assert.ok(box.x >= boundsBefore.arena.x && box.x + box.width <= boundsBefore.arena.x + boundsBefore.arena.width,
          "Team identity and navigation stay inside the arena at every tested width");
      }
      await arena.screenshot({ path: resolve(output, `team-${width}-${theme}.png`) });
      const boundsAfter = await arena.evaluate(bounds);
      writeFileSync(resolve(output, `bounds-${width}-${theme}.json`), JSON.stringify({ boundsBefore, boundsAfter }, null, 2));
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.ok((await arena.boundingBox()).y > 900, "Pause check places the team outside the viewport");
      await page.waitForFunction(() => {
        const root = [...document.querySelectorAll("main .team-neural__arena")].find((node) => node.getClientRects().length);
        const draws = window.__glStats.get(root?.querySelector(".team-neural-field canvas"))?.draws;
        if (window.__teamPaused?.draws !== draws) window.__teamPaused = { draws, at: performance.now() };
        return performance.now() - window.__teamPaused.at > 1500;
      }, null, { timeout: 60000 });
      const pausedDraws = await page.evaluate(() => window.__teamPaused.draws);
      await page.waitForTimeout(800);
      assert.equal(await arena.evaluate((root) => window.__glStats.get(root.querySelector(".team-neural-field canvas"))?.draws), pausedDraws, "Offscreen 3D stops GPU draws");
      await arena.scrollIntoViewIfNeeded();
      await page.waitForFunction((paused) => {
        const root = [...document.querySelectorAll("main .team-neural__arena")].find((node) => node.getClientRects().length);
        return window.__glStats.get(root?.querySelector(".team-neural-field canvas"))?.draws > paused;
      }, pausedDraws, { timeout: 30000 });
      assert.equal(errors.length, 0, errors.join("; "));
      checks.push({ kind: "team-real-3d-navigation-and-route-css", width, theme, borderRadius: border, nameFontSize: font,
        initialArena, initialCanvasCount, initial, firstSceneObservedMs, boundsBefore, boundsAfter,
        deferred: { jsEncodedBytes: settled.js.encodedBytes - initial.js.encodedBytes, cssEncodedBytes: settled.css.encodedBytes - initial.css.encodedBytes,
          assets: settled.assets.filter((asset) => !initial.assets.some((old) => old.path === asset.path)) },
        offscreenDrawsStoppedAndResumePassed: true, passed: true });
    } finally { await context.close(); }
  }
  return checks;
}
