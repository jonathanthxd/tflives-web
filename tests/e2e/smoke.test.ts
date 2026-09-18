import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

/**
 * Lightweight e2e smoke harness (rule 12). Requires a fresh build first:
 *
 *   npm run build
 *   npm run test:e2e
 *
 * It boots the built app against an isolated in-memory PostgreSQL (PGlite),
 * never touching the configured Neon `DATABASE_URL`.
 */
test(
  "core flows and hardened endpoints work over real HTTP",
  { timeout: process.env.TFL_TEST_PREVIEW ? 600000 : 600000 },
  async (t) => {
    const db = await PGlite.create();
    for (const migration of [
      "prisma/migrations/20260909000000_baseline/migration.sql",
      "prisma/migrations/20260909010000_network_content_core/migration.sql",
      "prisma/migrations/20260910000000_community_realtime/migration.sql",
      "prisma/migrations/20260911000000_accounts_security_permissions/migration.sql",
      "prisma/migrations/20260912000000_profiles_identity/migration.sql",
      "prisma/migrations/20260913000000_progression_achievements/migration.sql",
      "prisma/migrations/20260914000000_obtainable_achievements/migration.sql",
      "prisma/migrations/20260915000000_team_member_identity/migration.sql",
      "prisma/migrations/20260915000000_tfl_economy/migration.sql",
      "prisma/migrations/20260916000000_cosmetics_premium/migration.sql",
      "prisma/migrations/20260917000000_creator_ecosystem/migration.sql",
    ]) {
      await db.exec(readFileSync(migration, "utf8"));
    }
    for (const name of readdirSync("prisma/migrations").filter((entry) => entry > "20260917000000_creator_ecosystem").sort()) {
      if (name === "migration_lock.toml") continue;
      await db.exec(readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8"));
    }

    const socket = new PGLiteSocketServer({
      db,
      host: "127.0.0.1",
      port: 55438,
      maxConnections: 8,
    });
    await socket.start();

    const port = 3108;
    const origin = `http://localhost:${port}`;
    const app = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "-p", String(port)],
      {
        env: {
          ...process.env,
          DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:55438/postgres?connection_limit=1",
          BETTER_AUTH_URL: origin,
          BETTER_AUTH_SECRET: "isolated-e2e-secret-only-never-production-123456",
          AUTH_REQUIRE_EMAIL_VERIFICATION: "false",
          DISCORD_BOT_TOKEN: "",
          DISCORD_SERVER_ID: "invalid-test-guild",
        },
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      },
    );
    let logs = "";
    app.stdout?.on("data", (chunk) => { logs += chunk; });
    app.stderr?.on("data", (chunk) => { logs += chunk; });
    t.after(async () => {
      app.kill();
      await once(app, "exit").catch(() => {});
      await socket.stop();
      await db.close();
    });

    for (let attempt = 0; attempt < 80; attempt++) {
      try {
        if ((await fetch(`${origin}/api/discord`)).ok) break;
      } catch {
        /* Wait for the process to listen. */
      }
      if (app.exitCode !== null) assert.fail(`Next exited: ${logs.slice(-3000)}`);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    async function request(path: string, method = "GET", body?: unknown, cookie?: string) {
      return fetch(origin + path, {
        method,
        redirect: "manual",
        headers: {
          "Content-Type": "application/json",
          Origin: origin,
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    }

    // 1) Registration → session → profile round-trip.
    const signup = await request("/api/auth/sign-up/email", "POST", {
      name: "Smoke member",
      email: "smoke@example.test",
      password: "test-password-12345",
    });
    assert.equal(signup.status, 200, await signup.clone().text());
    const cookie = signup.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    assert.ok(cookie);

    const session = await request("/api/auth/get-session", "GET", undefined, cookie);
    assert.equal(session.status, 200);
    const sessionBody = (await session.json()) as { user?: { id: string } };
    assert.ok(sessionBody.user?.id);

    let response = await request("/api/profile", "PATCH", {
      username: "smoke_member",
      bio: "Smoke-tested profile.",
    }, cookie);
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal((await request(`/en/perfil/smoke_member`)).status, 200);

    // 2) Login → dashboard (suscripcion/account read).
    const signIn = await request("/api/auth/sign-in/email", "POST", {
      email: "smoke@example.test",
      password: "test-password-12345",
    });
    assert.equal(signIn.status, 200, await signIn.clone().text());
    const signInCookie = signIn.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    assert.equal((await request("/en/configuracion", "GET", undefined, signInCookie)).status, 200);

    // 3) Hardening: client error ingestion, sanitization, rate limiting.
    assert.equal((await request("/api/observability/client-error", "POST", {})).status, 400);
    response = await request("/api/observability/client-error", "POST", {
      message: "A smoke error with a secret token=abc123 and https://example.test/leak and jane@example.test",
      area: "smoke:e2e",
    });
    assert.equal(response.status, 202, await response.clone().text());

    // The e2e row must be sanitized (no token/URL/email) and marked client-side.
    const row = await db.query<{ source: string; lastStatus: number | null; message: string }>(
      'SELECT source, "lastStatus", message FROM "ApplicationError" ORDER BY "lastSeenAt" DESC LIMIT 1',
    );
    assert.equal(row.rows[0].source, "client");
    assert.equal(row.rows[0].lastStatus, 0);
    assert.doesNotMatch(row.rows[0].message, /token=abc123|example\.test|jane@/);

    // Rate limit: burst past the client-errors budget (20/5min) → 429.
    let got429 = false;
    for (let i = 0; i < 25 && !got429; i++) {
      const hit = await request("/api/observability/client-error", "POST", { message: `burst ${i}` });
      if (hit.status === 429) { got429 = true; break; }
    }
    assert.equal(got429, true, `expected a 429 from the client-error rate limit ${logs.slice(-2000)}`);

    // Unauthenticated writes stay blocked and admin pages redirect to login.
    assert.equal((await request("/api/community/comments", "POST", { postId: "missing", content: "x" })).status, 401);
    const admin = await request("/en/admin");
    assert.equal(admin.status, 307);
    assert.match(admin.headers.get("location") ?? "", /\/login/);

    console.log("E2E smoke passed.");
  },
);