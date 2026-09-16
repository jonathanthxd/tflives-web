import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { readFileSync } from "node:fs";
import {
  isPublicPost,
  translated,
} from "../../src/modules/editorial/publication";
import {
  modalitySchema,
  wikiSchema,
  teamSchema,
  timelineSchema,
} from "../../src/modules/editorial/content-validation";
import { postSchema } from "../../src/modules/editorial/validation";
import { canAccessSection } from "../../src/modules/administration/permissions";
import { articleHeadings } from "../../src/modules/wiki/headings";
import {
  queryMinecraft,
  encodeVarInt,
  decodeVarInt,
} from "../../src/infrastructure/external-services/minecraft-protocol";
import { getDiscordGuildCounts } from "../../src/infrastructure/external-services/discord";

test("publication boundaries hide drafts, archives and future schedules", () => {
  const now = new Date("2026-09-09T12:00:00Z");
  const post = { published: true, archived: false, scheduledFor: null };
  assert.equal(isPublicPost(post, now), true);
  assert.equal(isPublicPost({ ...post, published: false }, now), false);
  assert.equal(isPublicPost({ ...post, archived: true }, now), false);
  assert.equal(
    isPublicPost({ ...post, scheduledFor: new Date(now.getTime() + 1) }, now),
    false,
  );
  assert.equal(isPublicPost({ ...post, scheduledFor: now }, now), true);
});
test("text translations cannot replace visibility, author or IDs", () => {
  const item = {
    title: "Original",
    published: false,
    id: "safe",
    translations: { en: { title: "English", published: true, id: "unsafe" } },
  };
  assert.deepEqual(translated(item, "en"), { ...item, title: "English" });
  assert.equal(translated(item, "es").title, "Original");
});
test("content validation covers types, slugs, schedules and unsafe media", () => {
  for (const type of [
    "NEWS",
    "UPDATE",
    "CHANGELOG",
    "EVENT",
    "MAINTENANCE",
    "PATCH",
  ])
    assert.equal(
      postSchema.safeParse({
        title: "Title",
        slug: "valid-title",
        content: "Text",
        type,
      }).success,
      true,
    );
  assert.equal(
    postSchema.safeParse({
      title: "  ",
      slug: "Bad URL",
      content: "",
      type: "NEWS",
    }).success,
    false,
  );
  assert.equal(
    modalitySchema.safeParse({
      name: "Mode",
      slug: "mode",
      banner: "javascript:alert(1)",
    }).success,
    false,
  );
  assert.equal(
    wikiSchema.safeParse({
      title: "Guide",
      slug: "guide",
      content: "Body",
      state: "SCHEDULED",
    }).success,
    false,
  );
  assert.equal(
    teamSchema.safeParse({
      username: "member",
      roleTitle: "Role",
      translations: null,
    }).success,
    true,
  );
  assert.equal(
    timelineSchema.safeParse({
      title: "Milestone",
      dateLabel: "2026",
      description: "Description",
      order: 1.5,
    }).success,
    false,
  );
});
test("existing section permissions protect every content editor", () => {
  for (const section of [
    "posts",
    "modalities",
    "wiki",
    "timeline",
    "team",
  ] as const) {
    assert.equal(canAccessSection("USER", section), false);
    assert.equal(canAccessSection("ADMIN", section), true);
  }
  assert.equal(canAccessSection("MOD", "wiki"), true);
  assert.equal(canAccessSection("MOD", "modalities"), false);
});
test("TOC matches Markdown headings and ignores code fences", () => {
  const headings = articleHeadings(
    "# One\n\n```md\n# Hidden\n```\n\nTwo\n---\n\n## Three **bold**",
  );
  assert.deepEqual(
    headings.map((h) => h.text),
    ["One", "Two", "Three bold"],
  );
  assert.equal(headings[2].id, "section-3");
});
test("Minecraft handles fragmented packets and exposes only normalized data", async () => {
  const server = createServer((socket) =>
    socket.once("data", () => {
      const json = Buffer.from(
        JSON.stringify({
          players: { online: 0, max: 100, sample: [{ name: "private" }] },
          version: { name: "1.21", protocol: 767 },
          description: "Private backend info",
        }),
      );
      const body = Buffer.concat([
        Buffer.from([0]),
        encodeVarInt(json.length),
        json,
      ]);
      const packet = Buffer.concat([encodeVarInt(body.length), body]);
      socket.write(packet.subarray(0, 2));
      setTimeout(() => socket.end(packet.subarray(2)), 10);
    }),
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const result = await queryMinecraft("127.0.0.1", address.port, 1000);
    assert.equal(result.online, true);
    assert.equal(result.players, 0);
    assert.equal(result.maxPlayers, 100);
    assert.equal(JSON.stringify(result).includes("private"), false);
  } finally {
    server.close();
  }
  assert.equal(decodeVarInt(encodeVarInt(300))?.value, 300);
});
test("Minecraft timeout and malformed response remain graceful", async () => {
  for (const malformed of [false, true]) {
    const server = createServer((socket) => {
      if (malformed) socket.end(Buffer.from([1, 99]));
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    try {
      const address = server.address();
      assert.ok(address && typeof address !== "string");
      const result = await queryMinecraft("127.0.0.1", address.port, 50);
      assert.equal(result.online, false);
      assert.equal(result.players, null);
    } finally {
      server.close();
    }
  }
});
test("Discord missing credentials uses widget and failure never invents zero", async (t) => {
  const oldToken = process.env.DISCORD_BOT_TOKEN;
  const oldGuild = process.env.DISCORD_SERVER_ID;
  delete process.env.DISCORD_BOT_TOKEN;
  delete process.env.DISCORD_SERVER_ID;
  try {
    t.mock.method(globalThis, "fetch", async (url: string) => {
      assert.ok(url.includes("1246905708541120593/widget.json"));
      return Response.json({ presence_count: 0 });
    });
    assert.deepEqual(await getDiscordGuildCounts(), {
      presence_count: 0,
      member_count: null,
    });
    t.mock.restoreAll();
    t.mock.method(globalThis, "fetch", async () => {
      throw new Error("Offline");
    });
    assert.deepEqual(await getDiscordGuildCounts(), {
      presence_count: null,
      member_count: null,
    });
  } finally {
    if (oldToken === undefined) delete process.env.DISCORD_BOT_TOKEN;
    else process.env.DISCORD_BOT_TOKEN = oldToken;
    if (oldGuild === undefined) delete process.env.DISCORD_SERVER_ID;
    else process.env.DISCORD_SERVER_ID = oldGuild;
  }
});
test("new UI messages have matching ES/EN keys", () => {
  const es = JSON.parse(readFileSync("messages/es.json", "utf8")).Content;
  const en = JSON.parse(readFileSync("messages/en.json", "utf8")).Content;
  assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort());
});

test("home team constellation keeps every active linked member addressable in one compact 3D navigator", () => {
  const section = readFileSync("src/modules/administration/components/owners-section.tsx", "utf8");
  const constellation = readFileSync("src/modules/administration/components/team-constellation.tsx", "utf8");
  const neuralField = readFileSync("src/modules/administration/components/team-neural-field.tsx", "utf8");
  const css = readFileSync("src/styles/globals.css", "utf8");

  assert.match(section, /prisma\.teamMember\.findMany/);
  assert.doesNotMatch(section, /take:\s*3/);
  assert.match(section, /TeamConstellation/);
  assert.match(section, /premiumEntitlements/);
  assert.match(section, /equippedCosmetics/);
  assert.match(constellation, /TeamNeuralField/);
  assert.match(constellation, /AnimatePresence/);
  assert.match(constellation, /transitionVector/);
  assert.match(constellation, /ArrowLeft/);
  assert.match(constellation, /ArrowRight/);
  assert.match(constellation, /previousMemberLabel/);
  assert.match(constellation, /nextMemberLabel/);
  assert.match(constellation, /CosmeticAvatarFrame/);
  assert.match(constellation, /CosmeticNameplate/);
  assert.match(constellation, /CosmeticBannerLayer/);
  assert.match(constellation, /CosmeticAccentLayer/);
  assert.match(constellation, /team-neural__spotlight/);
  assert.match(constellation, /team-neural__navigator/);
  assert.match(neuralField, /@react-three\/fiber/);
  assert.match(neuralField, /@react-three\/drei/);
  assert.match(neuralField, /teamSpacePosition/);
  assert.match(neuralField, /CameraRig/);
  assert.match(neuralField, /<Canvas/);
  assert.match(neuralField, /<Stars/);
  assert.match(neuralField, /<Html/);
  assert.match(neuralField, /<lineSegments/);
  assert.match(css, /\.team-neural__arena/);
  assert.match(css, /\.team-neural-space-node__frame \*/);
  assert.match(css, /\.team-neural__navigator/);
  assert.match(css, /animation-play-state: paused !important/);
});
