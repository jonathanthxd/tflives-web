import assert from "node:assert/strict";

// Runtime prefetch RSC streams can stay pending in Next 16.3. Track actual
// page assets and API calls rather than using Playwright's networkidle.
export function observeInitialRequests(page, origin) {
  const pending = new Set();
  let lastFinished = Date.now();
  page.on("request", (request) => {
    if (!request.url().startsWith(origin)) return;
    const pathname = new URL(request.url()).pathname;
    if (
      ["script", "stylesheet", "font", "image"].includes(
        request.resourceType(),
      ) ||
      pathname.startsWith("/api/")
    )
      pending.add(request);
  });
  const finish = (request) => {
    if (pending.delete(request)) lastFinished = Date.now();
  };
  page.on("requestfinished", finish);
  page.on("requestfailed", finish);
  return async () => {
    const started = Date.now();
    while (Date.now() - started < 15000) {
      if (
        Date.now() - started >= 2500 &&
        pending.size === 0 &&
        Date.now() - lastFinished >= 1000
      )
        break;
      await page.waitForTimeout(100);
    }
    assert.equal(
      pending.size,
      0,
      "Initial page assets/API requests must finish",
    );
    return page.evaluate(() => performance.now());
  };
}
