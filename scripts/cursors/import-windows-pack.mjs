#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile, copyFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";

const source = process.argv[2] ? resolve(process.argv[2]) : null;
const packId = process.argv[3]?.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");

if (!source || !packId) {
  console.error("Usage: npm run cursor:import -- <extracted-pack-folder> <pack-id>");
  process.exit(1);
}

const output = resolve("public/cursors/imported", packId);

const ROLE_PATTERNS = [
  ["default", /(?:^|\b)(normal|pointer|arrow|default)(?:\b|$)/i],
  ["pointer", /(?:link|hand point|hand|select link)/i],
  ["text", /(?:text|beam|ibeam)/i],
  ["help", /help/i],
  ["wait", /(?:^|\b)(busy|wait)(?:\b|$)/i],
  ["progress", /(?:working|background|progress)/i],
  ["move", /move/i],
  ["precision", /(?:precision|crosshair)/i],
  ["not-allowed", /(?:unavailable|forbidden|not.?allowed)/i],
  ["ew-resize", /(?:horizontal|hori|horz|ew.?resize)/i],
  ["ns-resize", /(?:vertical|vert|ns.?resize)/i],
  ["nwse-resize", /(?:diagonal resize 1|diares1|dgn1|nwse)/i],
  ["nesw-resize", /(?:diagonal resize 2|diares2|dgn2|nesw)/i],
  ["grab", /(?:grab|handwriting)/i],
];

async function walk(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (/\.(?:cur|ani)$/i.test(entry.name)) files.push(path);
  }
  return files;
}

function align2(value) {
  return value + (value & 1);
}

function readChunks(buffer, start, end) {
  const chunks = [];
  let offset = start;
  while (offset + 8 <= end) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    const dataEnd = Math.min(dataStart + size, end);
    chunks.push({ id, size, dataStart, dataEnd });
    offset = dataStart + align2(size);
  }
  return chunks;
}

function parseAni(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "ACON") {
    throw new Error("Not a Windows ANI RIFF/ACON file");
  }

  let defaultRate = 6; // 6 jiffies = 100ms
  let rate = [];
  let sequence = [];
  const icons = [];

  for (const chunk of readChunks(buffer, 12, buffer.length)) {
    if (chunk.id === "anih" && chunk.dataEnd - chunk.dataStart >= 36) {
      defaultRate = buffer.readUInt32LE(chunk.dataStart + 28) || defaultRate;
    } else if (chunk.id === "rate") {
      for (let at = chunk.dataStart; at + 4 <= chunk.dataEnd; at += 4) rate.push(buffer.readUInt32LE(at));
    } else if (chunk.id === "seq ") {
      for (let at = chunk.dataStart; at + 4 <= chunk.dataEnd; at += 4) sequence.push(buffer.readUInt32LE(at));
    } else if (chunk.id === "LIST" && buffer.toString("ascii", chunk.dataStart, chunk.dataStart + 4) === "fram") {
      for (const child of readChunks(buffer, chunk.dataStart + 4, chunk.dataEnd)) {
        if (child.id === "icon") icons.push(buffer.subarray(child.dataStart, child.dataEnd));
      }
    }
  }

  if (!icons.length) throw new Error("ANI file contains no icon frames");
  if (!sequence.length) sequence = icons.map((_, index) => index);
  const frames = sequence.map((index) => icons[index]).filter(Boolean);
  const rates = sequence.map((_, index) => rate[index] ?? defaultRate);
  const averageJiffies = rates.length ? rates.reduce((sum, value) => sum + value, 0) / rates.length : defaultRate;

  return {
    frames,
    intervalMs: Math.max(40, Math.round((averageJiffies / 60) * 1000)),
  };
}

function inferRole(path) {
  const name = basename(path, extname(path)).replace(/[\[\]()_-]+/g, " ").replace(/\s+/g, " ").trim();
  for (const [role, pattern] of ROLE_PATTERNS) if (pattern.test(name)) return role;
  return null;
}

await mkdir(output, { recursive: true });
const candidates = await walk(source);
const chosen = new Map();

for (const path of candidates) {
  const role = inferRole(path);
  if (!role) continue;
  const current = chosen.get(role);
  // Prefer a file near the pack root over bonus/alternative variants.
  const depth = relative(source, path).split(/[\\/]/).length;
  const score = depth + (/bonus|alternative|extra/i.test(path) ? 10 : 0);
  if (!current || score < current.score) chosen.set(role, { path, score });
}

const manifest = {
  id: packId,
  source: relative(process.cwd(), source),
  generatedAt: new Date().toISOString(),
  roles: {},
};

for (const [role, { path }] of chosen) {
  const extension = extname(path).toLowerCase();
  if (extension === ".cur") {
    const name = `${role}-00.cur`;
    await copyFile(path, join(output, name));
    manifest.roles[role] = { frames: [name] };
    continue;
  }

  const parsed = parseAni(await readFile(path));
  const frames = [];
  for (let index = 0; index < parsed.frames.length; index += 1) {
    const name = `${role}-${String(index).padStart(2, "0")}.cur`;
    await writeFile(join(output, name), parsed.frames[index]);
    frames.push(name);
  }
  manifest.roles[role] = { frames, intervalMs: parsed.intervalMs };
}

await writeFile(join(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Imported ${Object.keys(manifest.roles).length} cursor roles into ${relative(process.cwd(), output)}`);
console.log("Review the source pack license before shipping imported assets publicly.");
