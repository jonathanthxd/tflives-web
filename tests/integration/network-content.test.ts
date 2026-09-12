import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

/** In-memory PostgreSQL only. Never reads DATABASE_URL or writes the configured Neon database. */
test(
  "populated migration and production HTTP acceptance",
  { timeout: process.env.TFL_TEST_PREVIEW ? 900000 : 240000 },
  async (t) => {
    const db = await PGlite.create();
    await db.exec(
      readFileSync(
        "prisma/migrations/20260909000000_baseline/migration.sql",
        "utf8",
      ),
    );
    await db.exec(`INSERT INTO "User" (id,email,name,"updatedAt") VALUES ('legacy','legacy@example.test','Legacy',now());
    INSERT INTO "Modality" (id,name) VALUES ('old-mode','Legacy mode');
    INSERT INTO "Post" (id,title,slug,content,type,"modalityId","authorId",published,"updatedAt") VALUES ('old-post','Legacy publication','legacy-publication','Original content','PATCH','old-mode','legacy',true,now());
    INSERT INTO "Comment" (id,"postId","authorId",content,"updatedAt") VALUES ('old-comment','old-post','legacy','Preserved comment',now());
    INSERT INTO "Reaction" (id,"userId","targetType","targetId") VALUES ('old-like','legacy','POST','old-post');`);
    await db.exec(
      readFileSync(
        "prisma/migrations/20260909010000_network_content_core/migration.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "prisma/migrations/20260910000000_community_realtime/migration.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "prisma/migrations/20260911000000_accounts_security_permissions/migration.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "prisma/migrations/20260912000000_profiles_identity/migration.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "prisma/migrations/20260913000000_progression_achievements/migration.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "prisma/migrations/20260914000000_obtainable_achievements/migration.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "prisma/migrations/20260915000000_team_member_identity/migration.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "prisma/migrations/20260915000000_tfl_economy/migration.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "prisma/migrations/20260916000000_cosmetics_premium/migration.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "prisma/migrations/20260917000000_creator_ecosystem/migration.sql",
        "utf8",
      ),
    );
    assert.equal((await db.query(`SELECT id FROM "Comment"`)).rows.length, 1);
    assert.equal((await db.query(`SELECT id FROM "Reaction"`)).rows.length, 1);
    const preserved = await db.query<{ slug: string; published: boolean }>(
      `SELECT slug,published FROM "Modality"`,
    );
    assert.match(preserved.rows[0].slug, /^mode-/);
    assert.equal(preserved.rows[0].published, true);
    const socket = new PGLiteSocketServer({
      db,
      host: "127.0.0.1",
      port: 55439,
      maxConnections: 8,
    });
    await socket.start();
    const port = 3109;
    const origin = `http://localhost:${port}`;
    const app = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "-p", String(port)],
      {
        env: {
          ...process.env,
          DATABASE_URL:
            "postgresql://postgres:postgres@127.0.0.1:55439/postgres?connection_limit=1",
          BETTER_AUTH_URL: origin,
          BETTER_AUTH_SECRET:
            "isolated-test-secret-only-never-production-123456",
          AUTH_REQUIRE_EMAIL_VERIFICATION: "false",
          DISCORD_BOT_TOKEN: "",
          DISCORD_SERVER_ID: "invalid-test-guild",
        },
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      },
    );
    let logs = "";
    app.stdout?.on("data", (chunk) => {
      logs += chunk;
    });
    app.stderr?.on("data", (chunk) => {
      logs += chunk;
    });
    t.after(async () => {
      app.kill();
      await once(app, "exit").catch(() => {});
      await socket.stop();
      await db.close();
    });
    for (let attempt = 0; attempt < 80; attempt++) {
      try {
        const response = await fetch(`${origin}/api/discord`);
        if (response.ok) break;
      } catch {
        /* Wait for the process to listen. */
      }
      if (app.exitCode !== null)
        assert.fail(`Next exited: ${logs.slice(-3000)}`);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    async function request(
      path: string,
      method = "GET",
      body?: unknown,
      cookie?: string,
    ) {
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
    const paths = [
      "/api/modalities",
      "/api/posts",
      "/api/admin/wiki",
      "/api/admin/wiki/categories",
      "/api/admin/team",
      "/api/admin/timeline",
    ];
    assert.equal((await request("/api/profile", "PATCH", { bio: "No session" })).status, 401);
    for (const path of paths)
      assert.equal((await request(path, "POST", {})).status, 401, path);
    for (const path of paths)
      for (const method of ["PATCH", "DELETE"])
        assert.equal(
          (await request(`${path}/missing`, method, {})).status,
          401,
          path,
        );
    const signup = await request("/api/auth/sign-up/email", "POST", {
      name: "Acceptance staff",
      email: "staff@example.test",
      password: "test-password-12345",
    });
    assert.equal(signup.status, 200, await signup.clone().text());
    const cookie = signup.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    assert.ok(cookie);

    assert.equal((await request("/api/account/wallet")).status, 401);
    let response = await request("/api/account/wallet", "GET", undefined, cookie);
    assert.equal(response.status, 200, await response.clone().text());
    assert.deepEqual(await response.json(), { balance: 0, recentTransactions: [] });
    assert.equal((await request("/api/admin/wallet", "GET", undefined, cookie)).status, 403);

    response = await request(
      "/api/profile",
      "PATCH",
      {
        displayName: "Profile member",
        username: "profile_member",
        bio: "A safely stored community bio.",
        socialLinks: [{ platform: "github", url: "https://github.com/profile-member" }],
      },
      cookie,
    );
    assert.equal(response.status, 200, await response.clone().text());
    const savedProfile = await response.json();
    assert.equal(savedProfile.user.username, "profile_member");
    assert.equal(savedProfile.user.email, undefined);

    response = await request("/api/profile", "PATCH", { role: "ADMIN" }, cookie);
    assert.equal(response.status, 400, await response.clone().text());
    response = await request(
      "/api/profile",
      "PATCH",
      { socialLinks: [{ platform: "website", url: "javascript:alert(1)" }] },
      cookie,
    );
    assert.equal(response.status, 400, await response.clone().text());
    response = await request("/api/profile", "PATCH", { username: "admin" }, cookie);
    assert.equal(response.status, 400, await response.clone().text());
    await db.exec(`INSERT INTO "User" (id,email,name,username,"updatedAt") VALUES ('profile-collision','profile-collision@example.test','Collision','taken_profile',now())`);
    response = await request("/api/profile", "PATCH", { username: "TAKEN_PROFILE" }, cookie);
    assert.equal(response.status, 409, await response.clone().text());
    response = await request("/api/profile", "PATCH", { userId: "profile-collision", bio: "Unauthorized target" }, cookie);
    assert.equal(response.status, 400, await response.clone().text());
    assert.equal((await request("/en/perfil/profile_member")).status, 200);
    assert.equal((await request("/en/perfil/no_such_profile")).status, 404);
    response = await request("/api/profile", "PATCH", { username: "profile_member_v2" }, cookie);
    assert.equal(response.status, 200, await response.clone().text());
    response = await request("/api/profile", "PATCH", { username: "profile_member_v3" }, cookie);
    assert.equal(response.status, 429, await response.clone().text());
    response = await request("/en/perfil/profile_member");
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "/en/perfil/profile_member_v2");
    assert.equal((await request("/en/perfil/profile_member_v2")).status, 200);
    assert.equal((await request("/en/configuracion", "GET", undefined, cookie)).status, 200);

    response = await request("/api/account/security", "GET", undefined, cookie);
    assert.equal(response.status, 200, await response.clone().text());
    const initialSecurity = await response.json();
    assert.equal(initialSecurity.sessions.length, 1);
    assert.equal(initialSecurity.sessions[0].current, true);
    assert.equal("token" in initialSecurity.sessions[0], false);

    const secondSignIn = await request("/api/auth/sign-in/email", "POST", {
      email: "staff@example.test",
      password: "test-password-12345",
    });
    assert.equal(secondSignIn.status, 200, await secondSignIn.clone().text());
    const secondCookie = secondSignIn.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    assert.ok(secondCookie);

    response = await request("/api/account/security", "GET", undefined, cookie);
    assert.equal(response.status, 200, await response.clone().text());
    const sessionsBeforeRevoke = await response.json();
    const secondarySession = sessionsBeforeRevoke.sessions.find((session: { id: string; current: boolean }) => !session.current);
    assert.ok(secondarySession);
    response = await request(
      "/api/account/security",
      "POST",
      { action: "revoke-session", sessionId: secondarySession.id },
      cookie,
    );
    assert.equal(response.status, 200, await response.clone().text());
    const revokedSession = await request("/api/auth/get-session", "GET", undefined, secondCookie);
    assert.equal(revokedSession.status, 200);
    assert.equal(await revokedSession.json(), null);

    for (const path of paths)
      assert.equal((await request(path, "POST", {}, cookie)).status, 403, path);
    const user = await signup.json();
    await db.query(`UPDATE "User" SET role='ADMIN' WHERE id=$1`, [
      user.user.id,
    ]);
    const creatorSignup = await request("/api/auth/sign-up/email", "POST", {
      name: "Creator member",
      email: "creator@example.test",
      password: "test-password-12345",
    });
    assert.equal(creatorSignup.status, 200, await creatorSignup.clone().text());
    const creatorCookie = creatorSignup.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    assert.ok(creatorCookie);
    response = await request("/api/profile", "PATCH", { username: "creator_member" }, creatorCookie);
    assert.equal(response.status, 200, await response.clone().text());
    response = await request("/api/creators/application", "POST", {
      primaryPlatform: "TWITCH", channelUrl: "javascript:alert(1)", category: "MINECRAFT", description: "Creator description", motivation: "Private creator motivation",
    }, creatorCookie);
    assert.equal(response.status, 400, await response.clone().text());
    response = await request("/api/creators/application", "POST", {
      primaryPlatform: "TWITCH", channelUrl: "https://twitch.tv/creator_member", category: "MINECRAFT", description: "Creator description", motivation: "Private creator motivation", activityFrequency: "Three streams a week",
    }, creatorCookie);
    assert.equal(response.status, 201, await response.clone().text());
    const creatorApplication = await response.json();
    response = await request("/api/creators/application", "POST", {
      primaryPlatform: "TWITCH", channelUrl: "https://twitch.tv/creator_member", category: "MINECRAFT", description: "Creator description", motivation: "Duplicate",
    }, creatorCookie);
    assert.equal(response.status, 409, await response.clone().text());
    assert.equal((await (await request("/en/streamers")).text()).includes("creator_member"), false);
    const moderatorSignup = await request("/api/auth/sign-up/email", "POST", {
      name: "Creator moderator", email: "creator-mod@example.test", password: "test-password-12345",
    });
    assert.equal(moderatorSignup.status, 200, await moderatorSignup.clone().text());
    const moderatorCookie = moderatorSignup.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    const moderator = await moderatorSignup.json();
    await db.query(`UPDATE "User" SET role='MOD' WHERE id=$1`, [moderator.user.id]);
    response = await request(`/api/admin/creators/applications/${creatorApplication.application.id}`, "PATCH", { action: "approve" }, moderatorCookie);
    assert.equal(response.status, 403, await response.clone().text());
    response = await request(`/api/admin/creators/applications/${creatorApplication.application.id}`, "PATCH", { action: "approve", adminNote: "Internal review note" }, cookie);
    assert.equal(response.status, 200, await response.clone().text());
    const approval = await response.json();
    assert.ok(approval.creatorId);
    const creatorsHtml = await (await request("/en/streamers")).text();
    assert.ok(creatorsHtml.includes("creator_member"));
    assert.equal(creatorsHtml.includes("Private creator motivation"), false);
    const creatorDetail = await (await request("/en/streamers/creator_member")).text();
    assert.ok(creatorDetail.includes("Creator member"));
    assert.equal(creatorDetail.includes("Internal review note"), false);
    response = await request("/api/creators/profile", "PATCH", { headline: "Live with TFLives", description: "Creator description", platforms: [{ type: "TWITCH", url: "https://twitch.tv/creator_member" }] }, creatorCookie);
    assert.equal(response.status, 200, await response.clone().text());
    response = await request("/api/creators/profile", "PATCH", { userId: user.user.id, headline: "Unauthorized" }, moderatorCookie);
    assert.equal(response.status, 400, await response.clone().text());
    response = await request("/api/social/follow", "POST", { username: "creator_member" }, cookie);
    assert.equal(response.status, 201, await response.clone().text());
    response = await request("/api/profile/like", "POST", { username: "creator_member" }, cookie);
    assert.equal(response.status, 200, await response.clone().text());
    response = await request(`/api/admin/creators/${approval.creatorId}`, "PATCH", { action: "pause" }, cookie);
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal((await (await request("/en/streamers")).text()).includes("creator_member"), false);
    response = await request(`/api/admin/creators/${approval.creatorId}`, "PATCH", { action: "reactivate" }, cookie);
    assert.equal(response.status, 200, await response.clone().text());
    response = await request(`/api/admin/creators/${approval.creatorId}`, "PATCH", { action: "update", featured: true }, cookie);
    assert.equal(response.status, 200, await response.clone().text());
    const rejectedSignup = await request("/api/auth/sign-up/email", "POST", {
      name: "Rejected creator", email: "rejected@example.test", password: "test-password-12345",
    });
    assert.equal(rejectedSignup.status, 200, await rejectedSignup.clone().text());
    const rejectedCookie = rejectedSignup.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    response = await request("/api/profile", "PATCH", { username: "rejected_creator" }, rejectedCookie);
    assert.equal(response.status, 200, await response.clone().text());
    response = await request("/api/creators/application", "POST", { primaryPlatform: "YOUTUBE", channelUrl: "https://youtube.com/@rejected_creator", category: "OTHER", description: "Rejected description", motivation: "Private rejected motivation" }, rejectedCookie);
    assert.equal(response.status, 201, await response.clone().text());
    const rejectedApplication = await response.json();
    response = await request(`/api/admin/creators/applications/${rejectedApplication.application.id}`, "PATCH", { action: "reject", adminNote: "Private administrative note", rejectionMessage: "Please apply again when your channel is ready." }, cookie);
    assert.equal(response.status, 200, await response.clone().text());
    response = await request("/api/creators/application", "GET", undefined, rejectedCookie);
    assert.equal(response.status, 200, await response.clone().text());
    const rejectedOwnApplication = await response.json();
    assert.equal("adminNote" in rejectedOwnApplication.application, false);
    assert.equal((await (await request("/en/streamers")).text()).includes("rejected_creator"), false);
    assert.ok((await db.query<{ count: number }>(`SELECT count(*)::int AS count FROM "AdminActionLog" WHERE action LIKE 'creator.%'`)).rows[0]?.count);
    response = await request("/api/admin/wallet?query=profile_member", "GET", undefined, cookie);
    assert.equal(response.status, 200, await response.clone().text());
    assert.ok((await response.json()).users.some((entry: { id: string }) => entry.id === user.user.id));
    response = await request(`/api/admin/wallet/${user.user.id}`, "POST", { direction: "GRANT", amount: 40, reason: "" }, cookie);
    assert.equal(response.status, 400, await response.clone().text());
    response = await request(`/api/admin/wallet/${user.user.id}`, "POST", { direction: "GRANT", amount: 40, reason: "Integration reward" }, cookie);
    assert.equal(response.status, 201, await response.clone().text());
    const grantedWallet = await response.json();
    response = await request(`/api/admin/wallet/${user.user.id}`, "POST", { direction: "DEDUCT", amount: 100000, reason: "Cannot overdraft" }, cookie);
    assert.equal(response.status, 400, await response.clone().text());
    response = await request("/api/account/wallet", "GET", undefined, cookie);
    assert.equal(response.status, 200, await response.clone().text());
    const rewardedWallet = await response.json();
    assert.equal(rewardedWallet.balance, grantedWallet.balance);
    assert.ok(rewardedWallet.recentTransactions.some((transaction: { amount: number }) => transaction.amount === 40));
    response = await request("/en/perfil/profile_member_v2");
    assert.equal(response.status, 200, await response.clone().text());
    assert.ok((await response.text()).includes("Administration"));
    for (const path of [
      "/es/network",
      "/en/network/estado",
      "/es/network/wiki",
      "/en/equipo",
      "/es/trayectoria",
      "/en/comunidad",
      "/es/tienda",
      "/en",
    ]) {
      const response = await request(path);
      assert.equal(
        response.status,
        200,
        `${path}: ${(await response.clone().text()).slice(-500)} ${logs.slice(-1000)}`,
      );
      const html = await response.text();
      if (path === "/es/tienda")
        assert.ok(html.includes('href="https://shop.tflives.com"'));
      if (path === "/es/network/wiki")
        assert.ok(html.includes("No hay artículos publicados todavía"));
      if (path === "/en/equipo")
        assert.ok(html.includes("The public team has not been configured yet"));
      if (path === "/es/trayectoria")
        assert.ok(html.includes("Aún no hay hitos publicados"));
    }
    async function create(path: string, body: unknown) {
      const response = await request(path, "POST", body, cookie);
      assert.equal(response.status, 201, await response.clone().text());
      const data = await response.json();
      return data.item ?? data.post;
    }
    const mode = await create("/api/modalities", {
      name: "Acceptance mode",
      slug: "acceptance-mode",
      published: true,
      status: "MAINTENANCE",
      order: 1,
    });
    const category = await create("/api/admin/wiki/categories", {
      name: "Guides",
      slug: "guides",
    });
    const draft = await create("/api/admin/wiki", {
      title: "Private guide",
      slug: "private-guide",
      content: "Secret draft",
      state: "DRAFT",
      categoryId: category.id,
      modalityId: mode.id,
    });
    assert.equal((await request("/es/network/wiki/private-guide")).status, 404);
    response = await request(
      `/api/admin/wiki/${draft.id}`,
      "PATCH",
      {
        ...draft,
        state: "PUBLISHED",
        translations: { en: { title: "English guide" } },
      },
      cookie,
    );
    assert.equal(response.status, 200, await response.clone().text());
    response = await request("/en/network/wiki/private-guide");
    assert.equal(response.status, 200);
    assert.ok((await response.text()).includes("English guide"));
    const team = await create("/api/admin/team", {
      username: "profile_member_v2",
      name: "Test member",
      roleTitle: "Editor",
      active: true,
      bio: "Test biography",
      socialLinks: ["https://example.test/profile"],
    });
    assert.ok(
      (await (await request("/en/equipo")).text()).includes("Test biography"),
    );
    const milestone = await create("/api/admin/timeline", {
      title: "Test milestone",
      dateLabel: "2026",
      description: "Test history",
      published: true,
    });
    assert.ok(
      (await (await request("/en/trayectoria")).text()).includes(
        "Test history",
      ),
    );
    response = await request(
      `/api/admin/team/${team.id}`,
      "PATCH",
      { ...team, bio: "Updated biography", translations: null },
      cookie,
    );
    assert.equal(response.status, 200, await response.clone().text());
    response = await request(
      `/api/admin/timeline/${milestone.id}`,
      "PATCH",
      { ...milestone, published: false },
      cookie,
    );
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal(
      (await (await request("/en/trayectoria")).text()).includes(
        "Test history",
      ),
      false,
    );
    response = await request(
      `/api/modalities/${mode.id}`,
      "PATCH",
      { ...mode, published: false },
      cookie,
    );
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal(
      (await (await request("/api/modalities")).text()).includes(
        "acceptance-mode",
      ),
      false,
    );
    const scheduled = await create("/api/posts", {
      title: "Scheduled private",
      slug: "scheduled-private",
      content: "Future content",
      type: "NEWS",
      published: true,
      scheduledFor: new Date(Date.now() + 600000).toISOString(),
    });
    assert.equal((await request(`/en/network/${scheduled.slug}`)).status, 404);
    response = await request(
      `/api/posts/${scheduled.id}`,
      "PATCH",
      { scheduledFor: new Date(Date.now() - 1000).toISOString() },
      cookie,
    );
    assert.equal(response.status, 200);
    assert.equal((await request(`/en/network/${scheduled.slug}`)).status, 200);
    const scheduledWiki = await create("/api/admin/wiki", {
      title: "Scheduled wiki",
      slug: "scheduled-wiki",
      content: "# Heading\n\nBody",
      state: "SCHEDULED",
      scheduledFor: new Date(Date.now() + 600000).toISOString(),
    });
    assert.equal(
      (await request("/en/network/wiki/scheduled-wiki")).status,
      404,
    );
    response = await request(
      `/api/admin/wiki/${scheduledWiki.id}`,
      "PATCH",
      {
        ...scheduledWiki,
        scheduledFor: new Date(Date.now() - 1000).toISOString(),
      },
      cookie,
    );
    assert.equal(response.status, 200);
    assert.equal(
      (await request("/en/network/wiki/scheduled-wiki")).status,
      200,
    );
    for (const type of [
      "NEWS",
      "UPDATE",
      "CHANGELOG",
      "EVENT",
      "MAINTENANCE",
    ]) {
      const post = await create("/api/posts", {
        title: type,
        slug: `acceptance-${type.toLowerCase()}`,
        content: "Body",
        type,
        published: false,
      });
      assert.equal((await request(`/en/network/${post.slug}`)).status, 404);
      response = await request(
        `/api/posts/${post.id}`,
        "PATCH",
        { published: true },
        cookie,
      );
      assert.equal(response.status, 200);
      assert.equal((await request(`/en/network/${post.slug}`)).status, 200);
      response = await request(
        `/api/posts/${post.id}`,
        "PATCH",
        { archived: true },
        cookie,
      );
      assert.equal(response.status, 200);
      assert.equal((await request(`/en/network/${post.slug}`)).status, 404);
      assert.equal(
        (
          await request(
            `/api/community/reactions?targetType=POST&targetId=${post.id}`,
          )
        ).status,
        404,
      );
    }
    for (const [path, item] of [
      ["/api/admin/team", team],
      ["/api/admin/timeline", milestone],
      ["/api/admin/wiki", draft],
    ] as const) {
      response = await request(
        `${path}/${item.id}`,
        "DELETE",
        undefined,
        cookie,
      );
      assert.equal(response.status, 200, path);
    }
    assert.equal((await request("/es/network/wiki/private-guide")).status, 404);

    assert.equal(
      (
        await request(
          "/api/admin/wiki",
          "POST",
          { title: "No content" },
          cookie,
        )
      ).status,
      400,
      logs.slice(-3000),
    );
    for (const route of ["posts", "wiki", "team", "timeline", "modalities"])
      assert.equal(
        (await request(`/en/admin/${route}`, "GET", undefined, cookie)).status,
        200,
      );
    assert.equal((await request("/es/network/legacy-publication")).status, 200);
    // The test-only socket adapter closes its connection after a SQL constraint error.
    // Keep the duplicate-key case last; Neon uses normal PostgreSQL connections.
    assert.equal(
      (
        await request(
          "/api/modalities",
          "POST",
          { name: "Duplicate", slug: mode.slug },
          cookie,
        )
      ).status,
      409,
    );
    if (process.env.TFL_TEST_PREVIEW) {
      console.log(
        "Acceptance passed. Preview available at http://localhost:3109/en/network. Send input to close.",
      );
      process.stdin.resume();
      await once(process.stdin, "data");
      process.stdin.pause();
    }
  },
);
