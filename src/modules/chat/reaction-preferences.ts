import { DEFAULT_QUICK_REACTIONS } from "@/modules/chat/quick-reactions";

const STORAGE_KEY = "tflives:reaction-preferences:v1";
const HALF_LIFE_MS = 1000 * 60 * 60 * 24 * 30;
const DEFAULT_BIAS = 1.35;
const MAX_TRACKED = 64;

interface ReactionUsage {
  score: number;
  lastUsedAt: number;
}

type ReactionUsageMap = Record<string, ReactionUsage>;

function decay(entry: ReactionUsage, now: number) {
  const age = Math.max(0, now - entry.lastUsedAt);
  return entry.score * Math.pow(0.5, age / HALF_LIFE_MS);
}

function readUsage(): ReactionUsageMap {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as ReactionUsageMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeUsage(usage: ReactionUsageMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

/**
 * Discord-like quick reactions: frequency is primary, but old usage gradually
 * loses weight. Defaults get a small prior so one accidental reaction does not
 * immediately replace them; a repeatedly used emoji naturally takes a slot.
 */
export function getQuickReactions(): string[] {
  const now = Date.now();
  const usage = readUsage();
  const candidates = new Set<string>([...DEFAULT_QUICK_REACTIONS, ...Object.keys(usage)]);
  return [...candidates]
    .map((emoji) => ({
      emoji,
      score: (usage[emoji] ? decay(usage[emoji], now) : 0) + (DEFAULT_QUICK_REACTIONS.includes(emoji as (typeof DEFAULT_QUICK_REACTIONS)[number]) ? DEFAULT_BIAS : 0),
      recent: usage[emoji]?.lastUsedAt ?? 0,
    }))
    .sort((a, b) => b.score - a.score || b.recent - a.recent)
    .slice(0, 3)
    .map((entry) => entry.emoji);
}

export function recordReactionUse(emoji: string): string[] {
  if (typeof window === "undefined") return [...DEFAULT_QUICK_REACTIONS];
  const now = Date.now();
  const usage = readUsage();
  const existing = usage[emoji];
  usage[emoji] = {
    score: (existing ? decay(existing, now) : 0) + 1,
    lastUsedAt: now,
  };

  const compact = Object.entries(usage)
    .map(([key, entry]) => ({ key, entry, score: decay(entry, now) }))
    .sort((a, b) => b.score - a.score || b.entry.lastUsedAt - a.entry.lastUsedAt)
    .slice(0, MAX_TRACKED);

  writeUsage(Object.fromEntries(compact.map(({ key, entry }) => [key, entry])));
  return getQuickReactions();
}
