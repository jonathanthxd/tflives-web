import assert from "node:assert/strict";
import { resolve } from "node:path";
import { installWebGLProbe } from "./studio-checks.mjs";

export async function checkTeam(browser, origin, output) {
  const checks = [];
  for (const width of [1440, 820, 390]) for (const theme of ["dark", "light"]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
    try {
      await context.addInitScript((theme) => localStorage.setItem("theme", theme), theme);
      await context.addInitScript(installWebGLProbe);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${origin}/es`, { waitUntil: "domcontentloaded" });
      const arena = page.locator(".team-neural__arena");
      await arena.waitFor({ timeout: 30000 });
      await arena.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const canvas = document.querySelector(".team-neural-field canvas");
        return window.__glStats.get(canvas)?.draws > 2;
      }, null, { timeout: 60000 });
      const selected = page.locator(".team-neural__display-name");
      const previous = await selected.textContent();
      await page.getByRole("button", { name: "Siguiente miembro", exact: true }).click();
      await page.waitForFunction((previous) => document.querySelector(".team-neural__display-name")?.textContent !== previous, previous);
      await page.waitForTimeout(500); // Preserve and allow the existing travel transition.
      const font = await selected.evaluate((node) => getComputedStyle(node).fontSize);
      const border = await arena.evaluate((node) => getComputedStyle(node).borderRadius);
      assert.ok(parseFloat(border) > 0 && parseFloat(font) > 0, "Constellation route CSS must be applied before interaction");
      await arena.screenshot({ path: resolve(output, `team-${width}-${theme}.png`) });
      assert.equal(errors.length, 0, errors.join("; "));
      checks.push({ kind: "team-real-3d-navigation-and-route-css", width, theme, borderRadius: border, nameFontSize: font, passed: true });
    } finally { await context.close(); }
  }
  return checks;
}
