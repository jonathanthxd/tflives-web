import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { openFullStudio, installWebGLProbe } from "./studio-checks.mjs";
import { observe } from "./interaction-checks.mjs";
import { installMetrics } from "./browser-metrics.mjs";

export async function checkV19(browser, origin, db, member, cookies, output) {
  const checks = [], measurements = [];
  await db.query(`INSERT INTO "Wallet" (id,"userId",balance,"updatedAt") VALUES ('v19-private-wallet',$1,987654,now()) ON CONFLICT ("userId") DO UPDATE SET balance=987654`, [member.id]);
  await db.query('INSERT INTO "UsernameAlias" (username,"userId") VALUES ($1,$2)', ["previous_fixture", member.id]);
  for (const locale of ["es", "en"]) {
    const path = `/${locale}/perfil/visual_fixture/opengraph-image`;
    const timings = [];
    for (let index = 0; index < 3; index++) {
      const start = performance.now();
      const response = await fetch(origin + path);
      assert.equal(response.status, 200, `Dynamic card ${locale}: ${response.status}`);
      assert.match(response.headers.get("content-type"), /image\/png/);
      assert.match(response.headers.get("cache-control"), /s-maxage=120/);
      const png = Buffer.from(await response.arrayBuffer());
      assert.equal(png.readUInt32BE(16), 1200); assert.equal(png.readUInt32BE(20), 630);
      timings.push({ observedMs: performance.now() - start, bytes: png.length });
      if (index === 0) writeFileSync(resolve(output, `profile-card-${locale}.png`), png);
    }
    measurements.push({ kind: "profile-card-cold-and-warm-local", locale, timings, scope: "local production Next cache; no Vercel CDN" });
    const alias = await fetch(origin + `/${locale}/perfil/previous_fixture/opengraph-image`);
    assert.equal(alias.status, 200);
    const html = await (await fetch(origin + `/${locale}/perfil/visual_fixture`, { headers: { "user-agent": "Twitterbot" } })).text();
    assert.match(html, new RegExp(`property="og:image" content="[^\"]*${path}"`));
    assert.match(html, new RegExp(`name="twitter:image" content="[^\"]*${path}"`));
    assert.doesNotMatch(html, /visual@example.test|987654/);
    const aliasHtml = await (await fetch(origin + `/${locale}/perfil/previous_fixture`, { headers: { "user-agent": "Twitterbot" } })).text();
    assert.match(aliasHtml, new RegExp(`property="og:image" content="[^\"]*${path}"`));
    checks.push({ kind: "profile-card-png-public-canonical-alias-and-twitter-html", locale, passed: true });
  }
  for (const path of ["/es/perfil/nonexistent_user/opengraph-image", "/es/perfil/x/opengraph-image", "/fr/perfil/visual_fixture/opengraph-image"]) assert.equal((await fetch(origin + path)).status, 404, path);
  const home = await (await fetch(origin + "/es", { headers: { "user-agent": "Twitterbot" } })).text();
  assert.doesNotMatch(home, /property="og:image" content="[^\"]*perfil\/visual_fixture/);
  checks.push({ kind: "missing-invalid-locale-card-404-and-general-home-og", passed: true });
  for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
    for (const locale of ["es", "en"]) for (const theme of ["dark", "light"]) {
      const labels = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
      const context = await browser.newContext({ viewport });
      await context.addCookies(cookies.map((entry) => { const split = entry.indexOf("="); return { name: entry.slice(0, split), value: entry.slice(split + 1), domain: "localhost", path: "/" }; }));
      await context.addInitScript(installMetrics, { theme, font: "tfl" });
      await context.addInitScript(installWebGLProbe);
      const page = await context.newPage(), errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.goto(origin + `/${locale}`, { waitUntil: "domcontentloaded" });
        const dialog = await openFullStudio(page, locale, "backgrounds");
        for (const id of ["silk", "ghost-fibers", "crt-warp", "molten-metal", "gradient-waves", "prism", "line-waves"]) assert.equal(await dialog.locator(`[data-studio-background="${id}"]`).isDisabled(), theme === "light");
        assert.ok(await page.evaluate(() => document.body.style.overflow === "hidden"));
        assert.ok(await dialog.evaluate((node) => node.contains(document.activeElement)), "Native modal contains focus");
        assert.ok(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 1), "Editor fits viewport");
        if (viewport.name === "mobile") assert.equal(Math.round((await dialog.boundingBox()).height), viewport.height);
        for (const id of ["blur", "darken", "brightness", "saturation", "vignette", "opacity"]) {
          const slider = dialog.locator(`[data-studio-control="${id}"] input`);
          const previous = await slider.inputValue();
          await slider.focus(); await page.keyboard.press("ArrowRight");
          if (id === "opacity") await page.keyboard.press("ArrowLeft");
          assert.notEqual(await slider.inputValue(), previous, id);
        }
        if (viewport.name === "desktop" && locale === "es" && theme === "dark") {
          for (const id of ["silk", "ghost-fibers", "crt-warp", "molten-metal", "gradient-waves", "prism", "line-waves"]) {
            console.log("Checking live engine", id);
            const opening = await observe(page, () => dialog.locator(`[data-studio-background="${id}"]`).click(), () => dialog.locator('[data-studio-preview] canvas').waitFor());
            measurements.push({ kind: "engine-first-selection", background: id, ...opening });
            await page.waitForFunction(() => window.__glStats.get(document.querySelector('[data-studio-preview] canvas'))?.draws > 2);
            const canvas = await dialog.locator('[data-studio-preview] canvas').elementHandle();
            const key = id === "prism" ? "timeScale" : id === "crt-warp" ? "curvature" : "speed";
            const input = dialog.locator(`[data-studio-control="${key}"] input`);
            await input.focus(); await page.keyboard.press("ArrowRight");
            const expected = Number(await input.inputValue());
            await page.waitForFunction(({ key, expected }) => {
              const stats = window.__glStats.get(document.querySelector('[data-studio-preview] canvas'));
              return Object.entries(stats.uniforms).some(([name, value]) => name.toLowerCase() === `u${key}`.toLowerCase() && Math.abs(value - expected) < 0.0001);
            }, { key, expected });
            assert.ok(await canvas.evaluate((node) => document.querySelector('[data-studio-preview] canvas') === node), `${id} must keep its GPU context when edited`);
            assert.equal(await dialog.locator('.studio-editor__gallery canvas').count(), 0);
            await dialog.getByRole("button", { name: labels.StudioV2.pausePreview, exact: true }).click();
            await page.waitForFunction((canvas) => {
              const stats = window.__glStats.get(canvas);
              if (stats.settleDraws !== stats.draws) { stats.settleDraws = stats.draws; stats.settleSince = performance.now(); }
              return performance.now() - stats.settleSince > 1000;
            }, canvas, { timeout: 60000, polling: 100 });
            const count = await canvas.evaluate((node) => window.__glStats.get(node).draws);
            await page.waitForTimeout(600);
            assert.equal(await canvas.evaluate((node) => window.__glStats.get(node).draws), count);
            checks.push({ kind: "engine-live-uniform-context-reuse-and-idle-pause", background: id, passed: true });
            console.log("Verified live engine", id);
            await canvas.dispose();
            await dialog.getByRole("button", { name: labels.StudioV2.resumePreview, exact: true }).click();
          }
          await dialog.locator('[data-studio-background="dot"]').click();
        }
        const composer = await page.evaluate(() => {
          const preview = document.querySelector("[data-studio-preview]");
          return { sampleFilter: getComputedStyle(preview.querySelector(".studio-editor__sample")).filter, backgroundFilter: [...preview.querySelectorAll("div")].map((node) => getComputedStyle(node).filter).find((filter) => filter.includes("blur(")) };
        });
        assert.equal(composer.sampleFilter, "none"); assert.match(composer.backgroundFilter, /blur/);
        await dialog.locator('[data-studio-category="presets"]').click();
        assert.equal(await dialog.locator('[data-appearance-preset]').count(), 8);
        const apply = await observe(page, () => dialog.locator('[data-appearance-preset="frost"]').click(), () => page.waitForFunction(() => document.documentElement.classList.contains("light")));
        measurements.push({ kind: "preset-switch", locale, theme, viewport: viewport.name, ...apply });
        await dialog.getByLabel(labels.StudioV2.presetName, { exact: true }).fill("Mi preset real");
        await dialog.getByRole("button", { name: labels.StudioV2.savePreset, exact: true }).click();
        const own = dialog.locator('[data-user-preset]');
        assert.equal(await own.count(), 1);
        await own.getByRole("button", { name: labels.StudioV2.rename, exact: true }).click();
        await dialog.getByLabel(labels.StudioV2.presetName, { exact: true }).fill("Renombrado");
        await dialog.locator("form").getByRole("button", { name: labels.StudioV2.rename, exact: true }).click();
        await own.getByText("Renombrado", { exact: true }).waitFor();
        await own.getByRole("button", { name: labels.StudioV2.delete, exact: true }).click();
        const confirm = page.locator('dialog[open]').last();
        await confirm.getByRole("button", { name: labels.StudioV2.cancel, exact: true }).last().click();
        assert.equal(await own.count(), 1);
        await own.getByRole("button", { name: labels.StudioV2.delete, exact: true }).click();
        await page.locator('dialog[open]').last().getByRole("button", { name: labels.StudioV2.delete, exact: true }).click();
        assert.equal(await own.count(), 0);
        await dialog.locator('[data-studio-category="cosmetics"]').click();
        await dialog.locator('.cosmetic-preview-scene').first().waitFor();
        assert.ok(await dialog.locator('.cosmetic-preview-scene').count() >= 5, "Real owned/equipped inventory appears");
        await dialog.locator('[data-studio-category="general"]').click();
        await dialog.getByRole("button", { name: labels.StudioV2.revert, exact: true }).click();
        await page.waitForFunction((theme) => document.documentElement.classList.contains(theme), theme);
        await page.screenshot({ path: resolve(output, `studio-v2-${viewport.name}-${locale}-${theme}.png`), animations: "disabled" });
        if (viewport.name === "desktop" && locale === "es" && theme === "dark") {
          for (const category of ["colors", "backgrounds", "typography", "cursors", "cosmetics", "presets"]) {
            await dialog.locator(`[data-studio-category="${category}"]`).click();
            await dialog.locator(".studio-editor__inspector").evaluate((node) => node.scrollTo(0, 0));
            await page.screenshot({ path: resolve(output, `studio-v2-category-${category}.png`), animations: "disabled" });
          }
        }
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => !document.querySelector('dialog[open]'));
        assert.equal(await page.evaluate(() => document.body.style.overflow), "");
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-haspopup")), "dialog");
        assert.deepEqual(errors, []);
        checks.push({ kind: "studio-v2-composition-preset-crud-inventory-revert-focus", viewport: viewport.name, locale, theme, passed: true });
      } finally { await context.close(); }
    }
  }
  const catalogContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await catalogContext.addInitScript(installMetrics, { theme: "dark", font: "tfl" });
  const catalog = await catalogContext.newPage();
  await catalog.goto(origin + "/es/cosmeticos", { waitUntil: "domcontentloaded" });
  const frames = catalog.locator('.cosmetic-preview-scene .cosmetic-avatar-frame');
  await frames.nth(15).waitFor({ state: "attached" });
  assert.equal(await frames.count(), 16);
  for (let index = 0; index < 16; index++) {
    const frame = frames.nth(index);
    await frame.scrollIntoViewIfNeeded();
    const variant = await frame.getAttribute("data-variant");
    await frame.locator("..").screenshot({ path: resolve(output, `frame-${variant}.png`), animations: "disabled" });
    if (variant === "petal") assert.equal(await frame.locator('.cosmetic-avatar-frame__piece').count(), 18);
  }
  const firstFrame = frames.first();
  await firstFrame.scrollIntoViewIfNeeded();
  await catalog.waitForFunction(() => document.querySelector('.cosmetic-preview-scene .cosmetic-avatar-frame').style.getPropertyValue('--cosmetic-play-state') === "running");
  await catalog.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await catalog.waitForFunction(() => document.querySelector('.cosmetic-preview-scene .cosmetic-avatar-frame').style.getPropertyValue('--cosmetic-play-state') === "paused");
  const studioLabels = JSON.parse(readFileSync("messages/es.json", "utf8")).Studio;
  await catalog.getByRole("button", { name: studioLabels.open, exact: true }).filter({ visible: true }).first().click();
  await catalog.locator('dialog[data-studio-quick][open]').getByRole("button", { name: studioLabels.light, exact: true }).click();
  await catalog.keyboard.press("Escape");
  await catalog.waitForFunction(() => document.documentElement.classList.contains("light"));
  for (let index = 0; index < 16; index++) {
    const frame = frames.nth(index);
    await frame.scrollIntoViewIfNeeded();
    const variant = await frame.getAttribute("data-variant");
    await frame.locator("..").screenshot({ path: resolve(output, `frame-light-${variant}.png`), animations: "disabled" });
  }
  await catalogContext.close();
  checks.push({ kind: "sixteen-real-css-frame-recipes-and-offscreen-pause", passed: true });
  // Start from legacy-only storage in a clean origin, then verify additive migration.
  const context = await browser.newContext();
  const legacy = JSON.stringify({ accent: "violet", font: "pixelify", background: "solid", cursor: "system" });
  await context.addInitScript((legacy) => { localStorage.setItem("tflives-studio-v1", legacy); localStorage.setItem("theme", "dark"); }, legacy);
  const page = await context.newPage();
  await page.goto(origin + "/es");
  await page.waitForFunction(() => document.body.dataset.tflFont === "pixelify");
  assert.equal(await page.evaluate(() => localStorage.getItem("tflives-studio-v1")), legacy);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("tflives-studio-v2")).preferences.accent), "violet");
  await context.close();
  checks.push({ kind: "legacy-migration-preserves-source-in-production-browser", passed: true });
  writeFileSync(resolve(output, "v19-checks.json"), JSON.stringify(checks, null, 2));
  writeFileSync(resolve(output, "v19-measurements.json"), JSON.stringify(measurements, null, 2));
  return checks;
}
