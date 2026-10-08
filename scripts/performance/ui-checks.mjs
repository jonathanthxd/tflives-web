import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function installBlobProbe() {
  window.__activeBlobUrls = new Set();
  const create = URL.createObjectURL.bind(URL);
  const revoke = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = (object) => {
    const url = create(object);
    window.__activeBlobUrls.add(url);
    return url;
  };
  URL.revokeObjectURL = (url) => {
    window.__activeBlobUrls.delete(url);
    revoke(url);
  };
}

export async function checkLoginFeedback(page, origin, locale) {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
  await page.goto(`${origin}/${locale}/login?error=account_not_linked`, {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByText(messages.Login.accountNotLinked, { exact: true })
    .filter({ visible: true })
    .first()
    .waitFor();
  await page.waitForFunction(
    () => !new URL(location.href).searchParams.has("error"),
  );
  assert.ok(
    await page
      .getByRole("alert")
      .getByText(messages.Login.accountNotLinked, { exact: true })
      .isVisible(),
    "Inline OAuth feedback survives notice URL cleanup",
  );
  return { kind: "oauth-feedback-url-cleanup", locale, passed: true };
}

export async function checkPrivateUi(page, locale, viewport, output) {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
  const checks = [];
  await page
    .locator("button[role=tab][aria-controls=settings-profile]")
    .click();
  const input = page.locator("input[type=file]").nth(1);
  await input.waitFor({ state: "attached" });
  await input.setInputFiles({
    name: "local-avatar-fixture.png",
    mimeType: "image/png",
    buffer: readFileSync("src/app/icon.png"),
  });
  const dialog = page.locator("dialog[open]").filter({ visible: true }).first();
  await dialog.waitFor();
  const image = dialog.locator('img[src^="blob:"]');
  await image.waitFor();
  await page.waitForFunction(
    () => document.querySelector("dialog[open] img")?.naturalWidth > 0,
  );
  const before = await image.evaluate((node) => node.style.transform);
  await dialog.getByRole("button", { name: "+", exact: true }).click();
  await page.waitForFunction(
    (before) =>
      document.querySelector("dialog[open] img").style.transform !== before,
    before,
  );
  await page.screenshot({
    path: resolve(output, `image-editor-${viewport.name}-${locale}.png`),
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await page.waitForFunction(() => window.__activeBlobUrls.size === 0);
  checks.push({
    kind: "avatar-editor-load-zoom-cancel-resource-disposal",
    viewport: viewport.name,
    locale,
    passed: true,
    upload: "not exercised: external storage",
  });
  await page
    .getByRole("button", { name: messages.GlobalChat.abrir, exact: true })
    .click();
  const expressions = page.getByRole("button", {
    name: messages.GlobalChat.emojisYStickers,
    exact: true,
  });
  await expressions.waitFor();
  await expressions.click();
  assert.equal(
    await expressions.getAttribute("aria-expanded"),
    "true",
    "The authenticated chat picker opens",
  );
  await page.screenshot({
    path: resolve(output, `global-chat-picker-${viewport.name}-${locale}.png`),
    animations: "disabled",
  });
  await expressions.click();
  await page
    .getByRole("button", { name: messages.GlobalChat.cerrar, exact: true })
    .click();
  checks.push({
    kind: "authenticated-chat-picker",
    viewport: viewport.name,
    locale,
    passed: true,
  });
  return checks;
}

export async function checkLoginLoadingLayout(browser, origin, output) {
  const checks = [];
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    // Without JS, streamed Suspense replacement scripts cannot move the page.
    // This exposes the initial loading shell, without replacing any response.
    const context = await browser.newContext({ viewport, javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      const response = await page.goto(`${origin}/es/login`, { waitUntil: "load" });
      assert.equal(response.status(), 200);
      const footer = await page.locator("footer").boundingBox();
      assert.ok(footer && footer.y >= viewport.height, "Login loading must reserve its viewport height before the footer");
      await page.screenshot({ path: resolve(output, `login-loading-${viewport.width}.png`) });
      checks.push({ kind: "login-loading-reserves-space-before-javascript", width: viewport.width, footerY: footer.y, passed: true });
    } finally { await context.close(); }
  }
  return checks;
}

export async function checkSelectedConversation(page, origin, id, output) {
  await page.goto(`${origin}/es/mensajes?c=${id}`, {
    waitUntil: "domcontentloaded",
  });
  const text = page
    .getByRole("article")
    .getByText("Local conversation regression fixture", {
      exact: true,
    });
  await text.waitFor();
  await page
    .getByRole("button")
    .filter({ hasText: "Visual Admin" })
    .first()
    .click();
  assert.ok(
    await text.isVisible(),
    "Selecting the current conversation must retain its loaded messages",
  );
  await page
    .getByRole("button", { name: "Emojis y stickers", exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await page.screenshot({
    path: resolve(output, "direct-message-picker.png"),
    animations: "disabled",
  });
  return {
    kind: "direct-message-query-selection-repeat-and-picker",
    passed: true,
  };
}
