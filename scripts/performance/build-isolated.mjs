import { createRequire } from "node:module";
import { resolve } from "node:path";
import { readFileSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { closeIsolatedDatabase } from "./close-database.mjs";
import { seedTeamFixture } from "./team-fixture.mjs";
const require = createRequire(resolve("package.json"));
const { PGlite } = require("@electric-sql/pglite");
const { PGLiteSocketServer } = require("@electric-sql/pglite-socket");
const db = await PGlite.create();
let socket;
try {
  for (const name of readdirSync("prisma/migrations")
    .filter((n) => /^\d/.test(n))
    .sort())
    await db.exec(
      readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8"),
    );
  if (process.env.TFL_TEAM_FIXTURE === "1") await seedTeamFixture(db);
  socket = new PGLiteSocketServer({
    db,
    host: "127.0.0.1",
    port: 55446,
    maxConnections: 8,
  });
  await socket.start();
  const ready = process.env.TFL_PRISMA_READY === "1";
  const command =
    (ready ? "npm exec -- next build" : "npm run build") +
    (process.env.TFL_BUILD_WEBPACK === "1"
      ? ready
        ? " --webpack"
        : " -- --webpack"
      : "");
  const child = spawn(
    process.platform === "win32" ? process.env.ComSpec : "/bin/sh",
    process.platform === "win32"
      ? ["/d", "/s", "/c", command]
      : ["-c", command],
    {
      windowsHide: true,
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL:
          "postgresql://postgres:postgres@127.0.0.1:55446/postgres?connection_limit=1&pgbouncer=true",
        BETTER_AUTH_SECRET: "isolated-build-placeholder-secret-1234567890",
        BETTER_AUTH_URL: "http://localhost:3117",
        AUTH_REQUIRE_EMAIL_VERIFICATION: "false",
        DISCORD_BOT_TOKEN: "",
        DISCORD_SERVER_ID: "invalid-test-guild",
        RESEND_API_KEY: "",
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "",
        DISCORD_CLIENT_ID: "",
        DISCORD_CLIENT_SECRET: "",
      },
    },
  );
  const [code] = await once(child, "exit");
  process.exitCode = code ?? 1;
} finally {
  if (socket) await closeIsolatedDatabase(socket, db);
  else await db.close();
}
