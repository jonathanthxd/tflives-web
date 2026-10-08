import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import {
  checkStudio,
  fontChoices,
  fontIsLoaded,
  installWebGLProbe,
} from "./studio-checks.mjs";
import { installMetrics, captureMetrics } from "./browser-metrics.mjs";
import { observeInitialRequests } from "./readiness.mjs";
import { closeIsolatedDatabase } from "./close-database.mjs";
import {
  installBlobProbe,
  checkLoginFeedback,
  checkPrivateUi,
  checkSelectedConversation,
  checkLoginLoadingLayout,
} from "./ui-checks.mjs";
const require = createRequire(resolve("package.json"));
const { PGlite } = require("@electric-sql/pglite");
const { PGLiteSocketServer } = require("@electric-sql/pglite-socket");
const { chromium } = require(process.env.TFL_PLAYWRIGHT || "playwright");
const output = resolve(
  process.env.TFL_PERF_OUTPUT || "performance-artifacts/current",
);
mkdirSync(output, { recursive: true });
const origin = "http://localhost:3117";
const db = await PGlite.create();
let socket, app, browser;
let serverErrors = "";
const visualChecks = [];
const coldFonts = [];
const warmNavigations = [];
const browserArgs = [
  "--disable-gpu",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
];
const extended = process.env.TFL_VISUAL_EXTENDED !== "0";
const fontVisitsOnly = process.env.TFL_FONT_VISITS_ONLY === "1";
const studioOnly = process.env.TFL_STUDIO_ONLY === "1";
const dmOnly = process.env.TFL_DM_ONLY === "1";
try {
  for (const migration of readdirSync("prisma/migrations")
    .filter((n) => /^\d/.test(n))
    .sort()) {
    await db.exec(
      readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"),
    );
  }
  socket = new PGLiteSocketServer({
    db,
    host: "127.0.0.1",
    port: 55447,
    maxConnections: 8,
  });
  await socket.start();
  app = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", "3117"],
    {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        DATABASE_URL:
          "postgresql://postgres:postgres@127.0.0.1:55447/postgres?connection_limit=1&pgbouncer=true",
        BETTER_AUTH_URL: origin,
        BETTER_AUTH_SECRET: "isolated-performance-test-only-1234567890",
        AUTH_REQUIRE_EMAIL_VERIFICATION: "false",
        DISCORD_BOT_TOKEN: "",
        DISCORD_SERVER_ID: "invalid-test-guild",
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "",
        DISCORD_CLIENT_ID: "",
        DISCORD_CLIENT_SECRET: "",
        RESEND_API_KEY: "",
      },
    },
  );
  app.stderr.on("data", (chunk) => {
    serverErrors += chunk;
  });
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(origin + "/api/discord")).ok) break;
    } catch {
      /* Server is starting. */
    }
    assert.equal(app.exitCode, null, "Production server exited");
    await new Promise((r) => setTimeout(r, 250));
  }
  const signup = await fetch(origin + "/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({
      name: "Visual Fixture",
      email: "visual@example.test",
      password: "isolated-visual-password-12345",
    }),
  });
  assert.equal(signup.status, 200, "Isolated test registration failed");
  const member = (await signup.json()).user;
  const cookies = signup.headers.getSetCookie().map((c) => c.split(";")[0]);
  const cookie = cookies.join("; ");
  const profile = await fetch(origin + "/api/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json", origin, cookie },
    body: JSON.stringify({
      username: "visual_fixture",
      bio: "Visual QA: áéíóú ñ — TFLives",
    }),
  });
  assert.equal(profile.status, 200, "Isolated profile update failed");
  await db.query('UPDATE "User" SET "createdAt" = $1 WHERE id = $2', [
    "2026-01-01T00:00:00Z",
    member.id,
  ]);
  const presets = ["BRONZE_FRAME", "AURORA_ACCENT", "VIOLET_NAMEPLATE"];
  for (const preset of presets) {
    const found = await db.query(
      'SELECT id,type FROM "Cosmetic" WHERE "visualPreset" = $1 ORDER BY id LIMIT 1',
      [preset],
    );
    assert.equal(found.rows.length, 1, `Missing cosmetic fixture ${preset}`);
    const c = found.rows[0];
    await db.query(
      "INSERT INTO \"UserCosmetic\" (user_id,cosmetic_id,source) VALUES ($1,$2,'PURCHASE')",
      [member.id, c.id],
    );
    await db.query(
      'INSERT INTO "EquippedCosmetic" (user_id,type,cosmetic_id,updated_at) VALUES ($1,$2,$3,now())',
      [member.id, c.type, c.id],
    );
  }
  for (const type of ["PROFILE_BADGE", "BANNER_STYLE"]) {
    const found = await db.query(
      'SELECT id,type FROM "Cosmetic" WHERE type = $1 ORDER BY slug LIMIT 1',
      [type],
    );
    assert.equal(found.rows.length, 1, `Missing cosmetic fixture ${type}`);
    const c = found.rows[0];
    await db.query(
      "INSERT INTO \"UserCosmetic\" (user_id,cosmetic_id,source) VALUES ($1,$2,'PURCHASE')",
      [member.id, c.id],
    );
    await db.query(
      'INSERT INTO "EquippedCosmetic" (user_id,type,cosmetic_id,updated_at) VALUES ($1,$2,$3,now())',
      [member.id, c.type, c.id],
    );
  }
  const adminSignup = await fetch(origin + "/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({
      name: "Visual Admin",
      email: "visual-admin@example.test",
      password: "isolated-admin-password-12345",
    }),
  });
  assert.equal(adminSignup.status, 200);
  const admin = (await adminSignup.json()).user;
  await db.query("UPDATE \"User\" SET role = 'ADMIN' WHERE id = $1", [
    admin.id,
  ]);
  const adminCookies = adminSignup.headers
    .getSetCookie()
    .map((c) => c.split(";")[0]);
  browser = await chromium.launch({
    headless: true,
    args: browserArgs,
    ...(process.env.TFL_CHROME_CHANNEL
      ? { channel: process.env.TFL_CHROME_CHANNEL }
      : {}),
  });
  const runMetadata = {
    node: process.version,
    next: require("next/package.json").version,
    buildId: readFileSync(".next/BUILD_ID", "utf8").trim(),
    browser: browser.version(),
    browserArgs,
    routeFilter: process.env.TFL_ROUTE_FILTER || null,
    phase: dmOnly ? "direct-message" : fontVisitsOnly
      ? "saved-fonts"
      : studioOnly
        ? "studio"
        : extended
          ? "all"
          : "routes",
  };
  writeFileSync(
    resolve(output, "run.json"),
    JSON.stringify(runMetadata, null, 2),
  );
  const results = [];
  let visitorNumber = 0;
  const routes = [
    "",
    "/network",
    "/network/wiki",
    "/login",
    "/register",
    "/perfil/visual_fixture",
    "/mensajes",
    "/configuracion",
    "/admin",
  ];
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    for (const locale of ["es", "en"]) {
      for (const theme of ["dark", "light"]) {
        for (const route of routes) {
          if (fontVisitsOnly || dmOnly) continue;
          if (process.env.TFL_ROUTE_FILTER && route !== (process.env.TFL_ROUTE_FILTER === "/" ? "" : process.env.TFL_ROUTE_FILTER)) continue;
          if (
            studioOnly &&
            route !== "" &&
            !(
              locale === "es" &&
              theme === "dark" &&
              ["/login", "/configuracion"].includes(route)
            )
          )
            continue;
          const authenticated = [
            "/mensajes",
            "/configuracion",
            "/admin",
          ].includes(route);
          const context = await browser.newContext({
            // Independent test visitors must not exhaust one shared loopback
            // IP's real auth quota. Reserved documentation IPs, local app only.
            extraHTTPHeaders: {
              "x-forwarded-for": `192.0.2.${++visitorNumber}`,
            },
            viewport: { width: viewport.width, height: viewport.height },
            locale: locale === "es" ? "es-ES" : "en-US",
            colorScheme: theme,
          });
          context.setDefaultTimeout(90000);
          context.setDefaultNavigationTimeout(90000);
          await context.addInitScript(installWebGLProbe);
          await context.addInitScript(installBlobProbe);
          if (authenticated)
            await context.addCookies(
              (route === "/admin" ? adminCookies : cookies).map((c) => ({
                name: c.slice(0, c.indexOf("=")),
                value: c.slice(c.indexOf("=") + 1),
                url: origin,
              })),
            );
          await context.addInitScript(installMetrics, { theme });
          const page = await context.newPage();
          const waitInitialRequests = observeInitialRequests(page, origin);
          const errors = [];
          page.on("pageerror", (e) => errors.push(e.message));
          page.on("console", (message) => {
            if (message.type() === "error") errors.push(message.text());
          });
          page.on("response", (r) => {
            if (r.url().startsWith(origin) && r.status() >= 400)
              console.log(
                "HTTP diagnostic",
                r.status(),
                new URL(r.url()).pathname,
              );
            if (
              r.url().startsWith(origin) &&
              /\.(js|css|woff2?|png|ico)(?:\?|$)/.test(r.url()) &&
              r.status() >= 400
            )
              errors.push(
                `Static resource HTTP ${r.status()}: ${new URL(r.url()).pathname}`,
              );
          });
          const response = await page.goto(origin + `/${locale}${route}`, {
            waitUntil: "domcontentloaded",
            timeout: 90000,
          });
          assert.equal(
            response.status(),
            200,
            `${locale}${route}: HTTP failed`,
          );
          await page.locator("main").first().waitFor({ timeout: 15000 });
          const mainVisibleObservedMs = await page.evaluate(() =>
            performance.now(),
          );
          await page.locator("main h1").first().waitFor();
          const headingVisibleObservedMs = await page.evaluate(() =>
            performance.now(),
          );
          // Next's runtime prefetch can remain pending. Observe rendered UI and
          // loaded font faces instead of requiring unrelated requests to stop.
          await page.waitForFunction(() => document.body.dataset.tflFont);
          await page.waitForFunction(
            (theme) => document.documentElement.classList.contains(theme),
            theme,
          );
          assert.ok(
            await fontIsLoaded(page),
            "The initial body font must load",
          );
          await page.evaluate(() => document.fonts.ready);
          const initialSettledObservedMs = await waitInitialRequests();
          const measured = await page.evaluate(captureMetrics);
          assert.equal(measured.lang, locale);
          assert.equal(
            errors.length,
            0,
            `${locale}${route}: ${errors.join("; ")}`,
          );
          const name = `${viewport.name}-${locale}-${theme}-${route.replaceAll("/", "_") || "home"}`;
          await page.screenshot({
            path: resolve(output, name + ".png"),
            fullPage: true,
            animations: "disabled",
          });
          const linkHeader = response.headers()["link"] || "";
          const html = await response.text();
          const fontPreloadHtml = (html.match(/<link[^>]+>/g) || []).filter(
            (tag) => /rel="preload"/.test(tag) && /as="font"/.test(tag),
          ).length;
          results.push({
            viewport: viewport.name,
            locale,
            theme,
            route,
            authenticated,
            status: response.status(),
            mainVisibleObservedMs,
            headingVisibleObservedMs,
            initialSettledObservedMs,
            fontPreloadHeaders: (linkHeader.match(/as="?font/g) || []).length,
            fontPreloadHtml,
            ...measured,
            errors,
          });
          writeFileSync(
            resolve(output, "measurements.json"),
            JSON.stringify(
              {
                kind: "laboratory-unthrottled-local-production",
                node: process.version,
                next: require("next/package.json").version,
                buildId: readFileSync(".next/BUILD_ID", "utf8").trim(),
                browser: browser.version(),
                browserArgs,
                results,
              },
              null,
              2,
            ),
          );
          console.log("Verified", name);
          if (route === "") {
            const previousAssets = await page.evaluate(captureMetrics);
            const started = await page.evaluate(() => ({ now: performance.now(), origin: performance.timeOrigin }));
            const networkLink = page
              .locator(`a[href="/${locale}/network"]`)
              .filter({ visible: true })
              .first();
            await networkLink.click();
            await page.waitForURL(origin + `/${locale}/network`);
            await page.getByRole("heading", { name: "TFL Network", exact: true }).waitFor();
            const reached = await page.evaluate(() => ({ now: performance.now(), origin: performance.timeOrigin }));
            assert.equal(reached.origin, started.origin, "Navigation must retain the client document");
            await waitInitialRequests();
            const currentAssets = await page.evaluate(captureMetrics);
            warmNavigations.push({ viewport: viewport.name, locale, theme, from: "/", to: "/network", headingVisibleObservedMs: reached.now - started.now, newJsEncodedBytes: currentAssets.js.encodedBytes - previousAssets.js.encodedBytes, newFontEncodedBytes: currentAssets.fonts.encodedBytes - previousAssets.fonts.encodedBytes });
            writeFileSync(resolve(output, "warm-navigation.json"), JSON.stringify({ ...runMetadata, observations: warmNavigations }, null, 2));
            assert.equal(errors.length, 0, "Client navigation runtime error");
            if (extended) {
              await page.goto(origin + `/${locale}`, {
                waitUntil: "domcontentloaded",
              });
              visualChecks.push(
                ...(await checkStudio(page, locale, theme, viewport, output)),
              );
              assert.equal(
                errors.length,
                0,
                "Studio runtime errors: " + errors.join("; "),
              );
              writeFileSync(
                resolve(output, "visual-checks.json"),
                JSON.stringify(visualChecks, null, 2),
              );
              console.log("Verified Studio", viewport.name, locale, theme);
            }
          }
          if (
            extended &&
            locale === "es" &&
            theme === "dark" &&
            route === "/login"
          )
            visualChecks.push(await checkLoginFeedback(page, origin, locale));
          if (
            extended &&
            locale === "es" &&
            theme === "dark" &&
            route === "/configuracion"
          )
            visualChecks.push(
              ...(await checkPrivateUi(page, locale, viewport, output)),
            );
          assert.equal(
            errors.length,
            0,
            "Runtime error during UI checks: " + errors.join("; "),
          );
          writeFileSync(
            resolve(output, "visual-checks.json"),
            JSON.stringify(visualChecks, null, 2),
          );
          await context.close();
        }
      }
    }
  }
  if ((extended || fontVisitsOnly) && !dmOnly)
    for (const viewport of [
      { name: "desktop", width: 1440, height: 900 },
      { name: "mobile", width: 390, height: 844 },
    ]) {
      for (const [font] of fontChoices) {
        const context = await browser.newContext({
          extraHTTPHeaders: { "x-forwarded-for": `192.0.2.${++visitorNumber}` },
          viewport: { width: viewport.width, height: viewport.height },
          locale: "es-ES",
          colorScheme: "dark",
        });
        context.setDefaultTimeout(90000);
        context.setDefaultNavigationTimeout(90000);
        await context.addInitScript(installMetrics, { theme: "dark", font });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        const response = await page.goto(origin + "/es", {
          waitUntil: "domcontentloaded",
        });
        assert.equal(response.status(), 200);
        await page.waitForFunction(
          (font) => document.body.dataset.tflFont === font,
          font,
        );
        assert.ok(
          await fontIsLoaded(page),
          "Saved font must load its real face on a cold visit",
        );
        await page.waitForTimeout(750);
        coldFonts.push({
          viewport: viewport.name,
          font,
          ...(await page.evaluate(captureMetrics)),
        });
        await page.screenshot({
          path: resolve(output, `saved-font-${viewport.name}-${font}.png`),
          animations: "disabled",
        });
        assert.equal(errors.length, 0, errors.join("; "));
        await context.close();
        writeFileSync(
          resolve(output, "saved-font-metrics.json"),
          JSON.stringify(coldFonts, null, 2),
        );
      }
    }
  if (extended && !fontVisitsOnly) {
    // Only after measurements: keep before/after fixture data identical.
    await db.query(
      "UPDATE \"User\" SET username = 'visual_admin' WHERE id = $1",
      [admin.id],
    );
    const created = await fetch(origin + "/api/messaging/conversations", {
      method: "POST",
      headers: { "content-type": "application/json", origin, cookie },
      body: JSON.stringify({ username: "visual_admin" }),
    });
    assert.equal(created.status, 201);
    const id = (await created.json()).conversation.id;
    const sent = await fetch(origin + `/api/messaging/conversations/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin, cookie },
      body: JSON.stringify({
        content: "Local conversation regression fixture",
      }),
    });
    assert.equal(sent.status, 201);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: { "x-forwarded-for": `192.0.2.${++visitorNumber}` },
    });
    context.setDefaultTimeout(90000);
    await context.addCookies(
      cookies.map((c) => ({
        name: c.slice(0, c.indexOf("=")),
        value: c.slice(c.indexOf("=") + 1),
        url: origin,
      })),
    );
    await context.addInitScript(installMetrics, { theme: "dark" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    visualChecks.push(
      await checkSelectedConversation(page, origin, id, output),
    );
    visualChecks.push(...await checkLoginLoadingLayout(browser, origin, output));
    assert.equal(errors.length, 0, errors.join("; "));
    await context.close();
    writeFileSync(
      resolve(output, "visual-checks.json"),
      JSON.stringify(visualChecks, null, 2),
    );
  }
  for (const path of ["/icon.png", "/favicon.ico", "/manifest.webmanifest"])
    assert.ok((await fetch(origin + path)).ok, path);
  console.log(
    `Completed ${results.length} production browser states and ${coldFonts.length} saved-font visits. Output: ${output}`,
  );
  // Next emits E1163 via console.warn, including on unchanged main. Preserve
  // and count it explicitly; actual exceptions and database failures still fail.
  const knownCacheWarning =
    /Error: Unexpected cache miss after cache warming phase during prerendering\.[^\r\n]*(?:\r?\n\s+at[^\r\n]*)*/g;
  const cacheWarningCount = [...serverErrors.matchAll(knownCacheWarning)]
    .length;
  const otherFailures = (
    serverErrors
      .replace(knownCacheWarning, "")
      .match(/Error:|PrismaClient|⨯/g) || []
  ).length;
  writeFileSync(
    resolve(output, "server-diagnostics.json"),
    JSON.stringify(
      {
        cacheWarningCount,
        knownWarning: "Next E1163; see v0.17 report",
        otherFailures,
      },
      null,
      2,
    ),
  );
  console.log("Next E1163 warnings recorded:", cacheWarningCount);
  assert.doesNotMatch(
    serverErrors.replace(knownCacheWarning, ""),
    /Error:|PrismaClient|⨯/,
    "Production server logged a runtime failure",
  );
} finally {
  writeFileSync(resolve(output, "server-errors.log"), serverErrors);
  if (browser) await browser.close();
  if (app && app.exitCode === null) {
    const exited = once(app, "exit");
    app.kill();
    await exited;
  }
  if (socket) await closeIsolatedDatabase(socket, db);
  else await db.close();
}
