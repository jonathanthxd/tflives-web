export function installMetrics({ theme, font }) {
  localStorage.setItem("theme", theme);
  if (font)
    localStorage.setItem(
      "tflives-studio-v1",
      JSON.stringify({
        accent: "blue",
        font,
        background: "dot",
        cursor: "system",
      }),
    );
  window.__perf = {
    lcp: 0,
    cls: 0,
    blocking: 0,
    lcpTag: null,
    lcpInMain: false,
  };
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__perf.lcp = entry.startTime;
      window.__perf.lcpTag = entry.element?.tagName ?? null;
      window.__perf.lcpInMain = Boolean(entry.element?.closest("main"));
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });
  let first = 0,
    last = 0,
    value = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.hadRecentInput) continue;
      if (
        last > 0 &&
        entry.startTime - last < 1000 &&
        entry.startTime - first < 5000
      )
        value += entry.value;
      else {
        first = entry.startTime;
        value = entry.value;
      }
      last = entry.startTime;
      window.__perf.cls = Math.max(window.__perf.cls, value);
    }
  }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries())
      window.__perf.blocking += Math.max(0, entry.duration - 50);
  }).observe({ type: "longtask", buffered: true });
}

export function captureMetrics() {
  const resources = performance.getEntriesByType("resource");
  const group = (pattern) => {
    const items = resources.filter((resource) => pattern.test(resource.name));
    return {
      count: items.length,
      encodedBytes: items.reduce((sum, item) => sum + item.encodedBodySize, 0),
      transferBytes: items.reduce((sum, item) => sum + item.transferSize, 0),
    };
  };
  return {
    ...window.__perf,
    fcp:
      performance.getEntriesByName("first-contentful-paint")[0]?.startTime ??
      null,
    ttfb: performance.getEntriesByType("navigation")[0].responseStart,
    js: group(/\.js(?:\?|$)/),
    css: group(/\.css(?:\?|$)/),
    fonts: group(/\.woff2?(?:\?|$)/),
    images: group(/\.(png|jpg|webp|ico)(?:\?|$)/),
    fontPreloads: document.querySelectorAll("link[rel=preload][as=font]")
      .length,
    assets: resources.filter((resource) => /\.(js|css|woff2?)(?:\?|$)/.test(resource.name)).map((resource) => ({
      path: new URL(resource.name).pathname,
      kind: resource.initiatorType,
      startMs: resource.startTime,
      durationMs: resource.duration,
      encodedBytes: resource.encodedBodySize,
      transferBytes: resource.transferSize,
    })),
    bodyFont: getComputedStyle(document.body).fontFamily,
    lang: document.documentElement.lang,
    theme: document.documentElement.className,
  };
}
