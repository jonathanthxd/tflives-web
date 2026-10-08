import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { captureMetrics } from "./browser-metrics.mjs";

export async function observe(page, action, ready) {
  const before = await page.evaluate(captureMetrics);
  const start = await page.evaluate(() => performance.now());
  const pending = new Set();
  let lastFinished = Date.now();
  const request = (request) => {
    if (["script", "stylesheet", "font", "image"].includes(request.resourceType())) pending.add(request);
  };
  const finish = (request) => { if (pending.delete(request)) lastFinished = Date.now(); };
  page.on("request", request);
  page.on("requestfinished", finish);
  page.on("requestfailed", finish);
  try {
  await action();
  await ready();
  const reached = await page.evaluate(() => performance.now());
  const settleStart = Date.now();
  while (Date.now() - settleStart < 15000) {
    if (Date.now() - settleStart >= 2500 && pending.size === 0 && Date.now() - lastFinished >= 1000) break;
    await page.waitForTimeout(100);
  }
  assert.equal(pending.size, 0, "Deferred interaction assets must finish");
  const after = await page.evaluate(captureMetrics);
  return {
    usableObservedMs: reached - start,
    assetsSettledObservedMs: (await page.evaluate(() => performance.now())) - start,
    newJsEncodedBytes: after.js.encodedBytes - before.js.encodedBytes,
    newCssEncodedBytes: after.css.encodedBytes - before.css.encodedBytes,
    newFontEncodedBytes: after.fonts.encodedBytes - before.fonts.encodedBytes,
    blockingObservedMs: after.blocking - before.blocking,
    newAssets: after.assets.filter((asset) => !before.assets.some((old) => old.path === asset.path)),
  };
  } finally {
    page.off("request", request);
    page.off("requestfinished", finish);
    page.off("requestfailed", finish);
  }
}

export async function checkInitialInteractions(page, route, locale, viewport) {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
  const results = [];
  if (route === "") {
    const button = page.getByRole("button", { name: messages.Studio.open, exact: true }).filter({ visible: true }).first();
    const ready = async () => {
      assert.ok(await button.isVisible(), "Opening Studio keeps its navigation trigger visible");
      await page.getByRole("button", { name: messages.StudioV2.openFull, exact: true }).waitFor();
    };
    const first = await observe(page, () => button.click(), ready);
    await page.keyboard.press("Escape");
    const second = await observe(page, () => button.click(), ready);
    await page.keyboard.press("Escape");
    results.push({ kind: "studio-quick-first-open-and-repeat", locale, viewport: viewport.name, first, second, passed: true });
    await button.click();
    const full = await observe(page, () => page.getByRole("button", { name: messages.StudioV2.openFull, exact: true }).click(), () => page.locator('[data-studio-category="general"]').waitFor());
    results.push({ kind: "studio-full-first-open", locale, viewport: viewport.name, first: full, passed: true });
    const fonts = await observe(page, () => page.locator('[data-studio-category="typography"]').click(), () => page.locator('[data-studio-font="rubik"]').waitFor());
    results.push({ kind: "studio-typography-first-open", locale, viewport: viewport.name, first: fonts, passed: true });
    await page.keyboard.press("Escape");

  }
  if (route === "/configuracion") {
    await page.locator("button[aria-controls=settings-profile]").click();
    const input = page.locator("input[type=file]").nth(1);
    const first = await observe(page, () => input.setInputFiles({ name: "local.png", mimeType: "image/png", buffer: readFileSync("src/app/icon.png") }),
      () => page.waitForFunction(() => document.querySelector("dialog[open] img")?.naturalWidth > 0));
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => window.__activeBlobUrls.size === 0);
    results.push({ kind: "image-editor-first-open", locale, viewport: viewport.name, first, passed: true });
    const button = page.getByRole("button", { name: messages.GlobalChat.emojisYStickers, exact: true }).filter({ visible: true }).first();
    const chat = await observe(page, () => page.getByRole("button", { name: messages.GlobalChat.abrir, exact: true }).click(), () => button.waitFor());
    results.push({ kind: "chat-first-open-resources", locale, viewport: viewport.name, first: chat, passed: true });
    const ready = () => page.getByRole("button", { name: "😀", exact: true }).waitFor();
    const picker = await observe(page, () => button.click(), ready);
    await page.getByRole("button", { name: "😀", exact: true }).click();
    assert.ok(await page.locator("textarea").filter({ visible: true }).first().inputValue().then((text) => text.includes("😀")), "Picker inserts the selected emoji on its first opening");
    await page.getByRole("button", { name: messages.GlobalChat.cerrar, exact: true }).click();
    results.push({ kind: "emoji-picker-first-open-and-insert", locale, viewport: viewport.name, first: picker, passed: true });
    if (process.env.TFL_QR_CHECK === "1" && locale === "es" && viewport.name === "desktop") {
      await page.locator("button[aria-controls=settings-security]").click();
      await page.locator("#two-factor-password").fill("isolated-visual-password-12345");
      const first = await observe(page,
        () => page.getByRole("button", { name: messages.Security.setupTwoFactor, exact: true }).click(),
        () => page.waitForFunction(() => {
          const image = document.querySelector('main img[src^="data:image/png"]');
          return image?.naturalWidth === 192;
        }));
      assert.equal(await page.getByRole("img", { name: messages.Security.qrAlt, exact: true }).getAttribute("width"), "192");
      results.push({ kind: "qr-encoder-real-isolated-two-factor-setup", locale, viewport: viewport.name, first, passed: true, credentials: "ephemeral local fixture; no URI or backup codes recorded" });
    }
  }
  return results;
}
