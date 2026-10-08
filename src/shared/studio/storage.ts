import { DEFAULT_STUDIO_PREFERENCES, STUDIO_STORAGE_KEY, isStudioAccent, isStudioBackground, isStudioFont, type StudioPreferences } from "./config";
import { normalizeStudioCursor } from "./cursors";
import { sanitizeBackgroundSettings, sanitizeComposition } from "./appearance";

export const STUDIO_V2_STORAGE_KEY = "tflives-studio-v2";
export const MAX_USER_PRESETS = 12;
export const MAX_STUDIO_STORAGE_BYTES = 64 * 1024;
export type StudioTheme = "dark" | "light" | "system";
export type UserAppearancePreset = { id: string; name: string; theme: StudioTheme; preferences: StudioPreferences };
export type StudioStorage = { version: 2; preferences: StudioPreferences; presets: UserAppearancePreset[] };
export const DEFAULT_STUDIO_STORAGE: StudioStorage = { version: 2, preferences: DEFAULT_STUDIO_PREFERENCES, presets: [] };
export type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function sanitizePreferences(value: unknown): StudioPreferences {
  const candidate = record(value);
  return {
    accent: isStudioAccent(candidate.accent) ? candidate.accent : DEFAULT_STUDIO_PREFERENCES.accent,
    font: isStudioFont(candidate.font) ? candidate.font : DEFAULT_STUDIO_PREFERENCES.font,
    background: isStudioBackground(candidate.background) ? candidate.background : DEFAULT_STUDIO_PREFERENCES.background,
    cursor: normalizeStudioCursor(candidate.cursor),
    composition: sanitizeComposition(candidate.composition),
    backgroundSettings: sanitizeBackgroundSettings(candidate.backgroundSettings),
    presetId: typeof candidate.presetId === "string" && /^[a-z0-9_-]{1,64}$/i.test(candidate.presetId) ? candidate.presetId : null,
  };
}
export function presetName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= 40 && !/[\u0000-\u001f\u007f<>]/.test(name) ? name : null;
}
export function sanitizeStudioStorage(value: unknown): StudioStorage | null {
  const candidate = record(value);
  if (candidate.version !== 2 || !candidate.preferences || typeof candidate.preferences !== "object" || Array.isArray(candidate.preferences)) return null;
  const presets: UserAppearancePreset[] = [];
  if (Array.isArray(candidate.presets)) for (const entry of candidate.presets.slice(0, MAX_USER_PRESETS)) {
    const item = record(entry);
    const name = presetName(item.name);
    if (!name || typeof item.id !== "string" || !/^[a-z0-9_-]{1,64}$/i.test(item.id) || presets.some((preset) => preset.id === item.id)) continue;
    if (item.theme !== "light" && item.theme !== "dark" && item.theme !== "system") continue;
    presets.push({ id: item.id, name, theme: item.theme, preferences: sanitizePreferences(item.preferences) });
  }
  return { version: 2, preferences: sanitizePreferences(candidate.preferences), presets };
}
function parsed(storage: PreferenceStorage, key: string): unknown {
  const text = storage.getItem(key);
  if (!text || text.length > MAX_STUDIO_STORAGE_BYTES) return null;
  try { return JSON.parse(text); } catch { return null; }
}
/** Never removes or rewrites v1: migration is additive and verified after writing. */
export function readStudioStorage(storage: PreferenceStorage): StudioStorage {
  try {
    const current = sanitizeStudioStorage(parsed(storage, STUDIO_V2_STORAGE_KEY));
    if (current) return current;
    const legacy = parsed(storage, STUDIO_STORAGE_KEY);
    return legacy ? { version: 2, preferences: sanitizePreferences(legacy), presets: [] } : DEFAULT_STUDIO_STORAGE;
  } catch { return DEFAULT_STUDIO_STORAGE; }
}
export function persistStudioStorage(storage: PreferenceStorage, value: StudioStorage): boolean {
  try {
    const safe = sanitizeStudioStorage(value);
    if (!safe) return false;
    const text = JSON.stringify(safe);
    if (text.length > MAX_STUDIO_STORAGE_BYTES) return false;
    storage.setItem(STUDIO_V2_STORAGE_KEY, text);
    return storage.getItem(STUDIO_V2_STORAGE_KEY) === text;
  } catch { return false; }
}
