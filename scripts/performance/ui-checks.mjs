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

export async function checkSelectedConversation(page, origin, id, output, otherId, viewport = "desktop") {
  const labels = JSON.parse(readFileSync("messages/es.json", "utf8")).MessagesPage;
  await page.goto(`${origin}/es/mensajes?c=${id}`, {
    waitUntil: "domcontentloaded",
  });
  const text = page
    .getByRole("article")
    .getByText("Local conversation regression fixture", {
      exact: true,
    });
  await text.waitFor();
  if (viewport === "mobile") await page.getByRole("button", { name: labels.volverAConversaciones, exact: true }).click();
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
  await page.getByRole("button", { name: "😀", exact: true }).waitFor();
  await page.screenshot({
    path: resolve(output, `direct-message-picker-${viewport}.png`),
    animations: "disabled",
  });
  if (otherId) {
    await page.getByRole("button", { name: "😀", exact: true }).click();
    const composer = page.getByPlaceholder(labels.escribiMensaje, { exact: true });
    assert.ok((await composer.inputValue()).includes("😀"));
    const sent = `Browser send ${viewport} 😀`;
    await composer.fill(sent);
    await page.getByRole("button", { name: labels.enviar, exact: true }).filter({ visible: true }).click();
    await page.getByRole("article").getByText(sent, { exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector("main textarea")?.value === "");
    assert.equal(await page.getByRole("button", { name: labels.enviar, exact: true }).filter({ visible: true }).isDisabled(), true);
    const documentOrigin = await page.evaluate(() => performance.timeOrigin);
    const choose = async (name) => {
      if (viewport === "mobile") await page.getByRole("button", { name: labels.volverAConversaciones, exact: true }).click();
      await page.getByRole("button").filter({ hasText: name }).filter({ visible: true }).first().click();
    };
    await choose("Visual Peer");
    await page.waitForURL(`${origin}/es/mensajes?c=${otherId}`);
    await composer.waitFor();
    assert.equal(await text.count(), 0, "Messages from the previous conversation cannot leak into an empty conversation");
    await choose("Visual Admin");
    await page.getByRole("article").getByText(sent, { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => performance.timeOrigin), documentOrigin, "Conversation switches keep the client document");
    if (viewport === "desktop") {
      await page.getByRole("button").filter({ hasText: "Visual Peer" }).first().click();
      await page.getByRole("button").filter({ hasText: "Visual Admin" }).first().click();
      await text.waitFor();
      await page.waitForURL(`${origin}/es/mensajes?c=${id}`);
    }
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("article").getByText(sent, { exact: true }).waitFor();
    await page.goto(`${origin}/es/mensajes?c=nonexistent-local-conversation`, { waitUntil: "domcontentloaded" });
    await page.getByRole("alert").getByText(labels.errorGenerico, { exact: true }).waitFor();
  }
  return {
    kind: otherId ? "direct-message-first-picker-emoji-send-switch-empty-reload-and-error" : "direct-message-query-selection-repeat-and-picker",
    viewport,
    passed: true,
  };
}

export async function checkProfileRefresh(page, locale, viewport) {
  const labels = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")).Profile;
  let requests = 0;
  const count = (request) => { if (request.url().includes("/api/profile/progress?username=visual_fixture")) requests++; };
  page.on("request", count);
  try {
    await page.setViewportSize({ width: viewport.width, height: 300 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const before = requests;
    await page.waitForTimeout(11000);
    assert.equal(requests, before, "Offscreen profile progress must not poll");
    const refreshed = page.waitForResponse((response) => response.url().includes("/api/profile/progress?username=visual_fixture") && response.status() === 200);
    await page.getByRole("region", { name: labels.progression, exact: true }).scrollIntoViewIfNeeded();
    await refreshed;
    assert.ok(requests > before, "Visible progress refreshes immediately after returning to view");
    return { kind: "profile-identity-retained-offscreen-polling-stops-and-resumes", passed: true, offscreenRequests: 0 };
  } finally {
    page.off("request", count);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
  }
}
