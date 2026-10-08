import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const fontChoices = [
  ["tfl", "TFL Original"],
  ["nunito", "Nunito"],
  ["vt323", "VT323"],
  ["outfit", "Outfit"],
  ["fredoka", "Fredoka"],
  ["pixelify", "Pixelify Sans"],
  ["chakra", "Chakra Petch"],
  ["quicksand", "Quicksand"],
  ["rubik", "Rubik"],
];
const animatedChoices = [
  ["silk", "Silk"],
  ["ghost-fibers", "Ghost Fibers"],
  ["crt-warp", "CRT Warp"],
  ["molten-metal", "Molten Metal"],
  ["gradient-waves", "Gradient Waves"],
  ["prism", "Prism"],
  ["line-waves", "Line Waves"],
];

// Test instrumentation: count actual GPU draw calls and changing time uniforms,
// independently of CSS animation or other moving elements in a screenshot.
export function installWebGLProbe() {
  window.__glStats = new WeakMap();
  const locations = new WeakMap();
  const statsFor = (gl) => {
    let stats = window.__glStats.get(gl.canvas);
    if (!stats) {
      stats = { draws: 0, times: new Set(), colors: new Set() };
      window.__glStats.set(gl.canvas, stats);
    }
    return stats;
  };
  for (const Type of [
    window.WebGLRenderingContext,
    window.WebGL2RenderingContext,
  ]) {
    if (!Type) continue;
    const prototype = Type.prototype;
    const getLocation = prototype.getUniformLocation;
    prototype.getUniformLocation = function (program, name) {
      const location = getLocation.call(this, program, name);
      if (location) locations.set(location, name);
      return location;
    };
    const uniform = prototype.uniform1f;
    prototype.uniform1f = function (location, value) {
      if (/time/i.test(locations.get(location) || ""))
        statsFor(this).times.add(value);
      return uniform.call(this, location, value);
    };
    const uniform3f = prototype.uniform3f;
    prototype.uniform3f = function (location, ...values) {
      if (/color/i.test(locations.get(location) || ""))
        statsFor(this).colors.add(values.join(","));
      return uniform3f.call(this, location, ...values);
    };
    for (const name of [
      "drawArrays",
      "drawElements",
      "drawArraysInstanced",
      "drawElementsInstanced",
    ]) {
      const draw = prototype[name];
      if (!draw) continue;
      prototype[name] = function (...args) {
        statsFor(this).draws++;
        return draw.apply(this, args);
      };
    }
  }
}

export async function fontIsLoaded(page) {
  return page.evaluate(async () => {
    const primary = getComputedStyle(document.body)
      .fontFamily.split(",")[0]
      .replace(/["']/g, "")
      .trim();
    await document.fonts.ready;
    return Array.from(document.fonts).some(
      (face) =>
        face.family.replace(/["']/g, "") === primary &&
        face.status === "loaded",
    );
  });
}

async function studio(page, locale) {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
  await page
    .getByRole("button", { name: messages.Studio.open, exact: true })
    .filter({ visible: true })
    .first()
    .click();
  return page.getByRole("dialog").filter({ visible: true }).first();
}

export async function checkStudio(page, locale, theme, viewport, output) {
  const checks = [];
  const accentLabels = [
    "Blue",
    "Slate",
    "Rose intense",
    "Pink",
    "Fuchsia",
    "Violet",
    "Indigo",
    "Sky",
    "Cyan",
    "Teal",
    "Emerald",
    "Green",
    "Lime",
    "Yellow",
    "Amber",
    "Orange",
    "Red",
  ];
  for (const label of accentLabels) {
    const dialog = await studio(page, locale);
    await dialog.getByRole("radio", { name: label, exact: true }).click();
    await page.keyboard.press("Escape");
    const selected = label === "Rose intense" ? "rose" : label.toLowerCase();
    await page.waitForFunction(
      (id) => document.documentElement.dataset.tflAccent === id,
      selected,
    );
    await page.waitForFunction(
      (id) =>
        JSON.parse(localStorage.getItem("tflives-studio-v1")).accent === id,
      selected,
    );
    await page.waitForFunction(
      (id) => document.documentElement.dataset.tflAccent === id,
      selected,
    );
    if (["rose", "emerald", "violet"].includes(selected))
      await page.screenshot({
        path: resolve(
          output,
          `accent-${viewport.name}-${locale}-${theme}-${selected}.png`,
        ),
        animations: "disabled",
      });
    checks.push({
      kind: "accent-selection-and-persistence",
      viewport: viewport.name,
      locale,
      theme,
      accent: selected,
      passed: true,
    });
    console.log("Verified accent", viewport.name, locale, theme, selected);
  }
  await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(
    () => document.documentElement.dataset.tflAccent === "red",
  );
  const resetAccent = await studio(page, locale);
  await resetAccent.getByRole("radio", { name: "Blue", exact: true }).click();
  await page.keyboard.press("Escape");
  for (const [id, label] of fontChoices) {
    const dialog = await studio(page, locale);
    await dialog
      .locator("button[aria-pressed]")
      .filter({ has: page.getByText(label, { exact: true }) })
      .click();
    await page.waitForFunction(
      (id) => document.body.dataset.tflFont === id,
      id,
    );
    assert.ok(
      await fontIsLoaded(page),
      `Font ${id} must use a real loaded face`,
    );
    await page.keyboard.press("Escape");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      (id) => document.body.dataset.tflFont === id,
      id,
    );
    assert.ok(await fontIsLoaded(page), `Saved font ${id} survives reload`);
    await page.screenshot({
      path: resolve(
        output,
        `font-${viewport.name}-${locale}-${theme}-${id}.png`,
      ),
      animations: "disabled",
    });
    checks.push({
      kind: "font-selection-and-persistence",
      viewport: viewport.name,
      locale,
      theme,
      font: id,
      passed: true,
    });
    console.log("Verified font", viewport.name, locale, theme, id);
  }
  if (locale === "es" && theme === "dark") {
    const labels = JSON.parse(readFileSync("messages/es.json", "utf8")).Studio;
    for (const id of ["dot", "shading", "solid"]) {
      const dialog = await studio(page, locale);
      await dialog
        .locator("button[aria-pressed]")
        .filter({
          has: page.getByText(labels.backgroundNames[id], { exact: true }),
        })
        .click();
      await page.keyboard.press("Escape");
      await page.waitForFunction(
        (id) => document.documentElement.dataset.tflBackground === id,
        id,
      );
      await page.screenshot({
        path: resolve(output, `background-${viewport.name}-${id}.png`),
        animations: "disabled",
      });
      checks.push({
        kind: "static-background",
        viewport: viewport.name,
        background: id,
        passed: true,
      });
    }
    for (const [id, label] of animatedChoices) {
      const dialog = await studio(page, locale);
      await dialog
        .locator("button[aria-pressed]")
        .filter({ has: page.getByText(label, { exact: true }) })
        .click();
      await page.keyboard.press("Escape");
      await page
        .locator(".studio-background--animated canvas")
        .first()
        .waitFor();
      await page.waitForFunction(
        () => {
          const canvas = document.querySelector(
            ".studio-background--animated canvas",
          );
          const stats = window.__glStats?.get(canvas);
          return stats && stats.draws > 2 && stats.times.size > 2;
        },
        null,
        { timeout: 30000 },
      );
      await page.screenshot({
        path: resolve(output, `background-${viewport.name}-${id}.png`),
      });
      checks.push({
        kind: "animated-background-draws-and-time-uniforms",
        viewport: viewport.name,
        background: id,
        passed: true,
      });
      console.log("Verified animated background", viewport.name, id);
      if (id === "silk") {
        const dialog = await studio(page, locale);
        await dialog
          .getByRole("radio", { name: "Rose intense", exact: true })
          .click();
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => {
          const canvas = document.querySelector(
            ".studio-background--animated canvas",
          );
          return window.__glStats.get(canvas)?.colors.size > 1;
        });
        await page.screenshot({
          path: resolve(output, `background-${viewport.name}-silk-rose.png`),
        });
        checks.push({
          kind: "silk-live-accent-uniform-update",
          viewport: viewport.name,
          passed: true,
        });
        const reset = await studio(page, locale);
        await reset.getByRole("radio", { name: "Blue", exact: true }).click();
        await page.keyboard.press("Escape");
      }
    }
  }
  return checks;
}
