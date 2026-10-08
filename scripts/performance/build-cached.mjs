import { createServer } from "node:http";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
const cache = resolve(
  process.env.TFL_FONT_CACHE_DIR || "performance-artifacts/font-cache",
);
const require = createRequire(import.meta.url);
const css = require(resolve(cache, "responses.cjs"));
const inventory = JSON.parse(
  readFileSync(resolve(cache, "inventory.json"), "utf8"),
);
const byUrl = new Map(inventory.map((font) => [font.url, font.sha256]));
const rewritten = Object.fromEntries(
  Object.entries(css).map(([url, text]) => [
    url,
    text.replace(
      /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g,
      (_, fontUrl) => {
        const sha = byUrl.get(fontUrl);
        if (!sha) throw new Error("Font is not in the verified cache");
        return `url(http://127.0.0.1:3116/${sha}.woff2)`;
      },
    ),
  ]),
);
const responsePath = resolve(cache, "responses-http.cjs");
writeFileSync(
  responsePath,
  "module.exports = " + JSON.stringify(rewritten) + ";\n",
);
const server = createServer((request, response) => {
  const filename = request.url.slice(1);
  if (!/^[a-f0-9]{64}\.woff2$/.test(filename)) {
    response.writeHead(404);
    response.end();
    return;
  }
  response.writeHead(200, { "content-type": "font/woff2" });
  response.end(readFileSync(resolve(cache, filename)));
});
server.listen(3116, "127.0.0.1");
await once(server, "listening");
try {
  const build = spawn(
    process.execPath,
    [resolve(import.meta.dirname, "build-isolated.mjs")],
    {
      windowsHide: true,
      stdio: "inherit",
      env: {
        ...process.env,
        NEXT_FONT_GOOGLE_MOCKED_RESPONSES: responsePath,
        TFL_BUILD_WEBPACK: "0",
      },
    },
  );
  const [code] = await once(build, "exit");
  process.exitCode = code ?? 1;
} finally {
  server.close();
}
