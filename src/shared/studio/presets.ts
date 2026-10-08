import { DEFAULT_STUDIO_PREFERENCES, type StudioAccentId, type StudioBackgroundId, type StudioFontId, type StudioPreferences } from "./config";
import { sanitizePreferences, type StudioTheme } from "./storage";

export type AppearancePreset = { id: string; name: string; theme: StudioTheme; preferences: StudioPreferences };
function preset(id: string, name: string, theme: StudioTheme, accent: StudioAccentId, background: StudioBackgroundId, font: StudioFontId = "tfl"): AppearancePreset {
  return { id, name, theme, preferences: sanitizePreferences({ ...DEFAULT_STUDIO_PREFERENCES, accent, background, font, presetId: id }) };
}
/** Included recipes use existing renderers and preserve every historical ID. */
export const APPEARANCE_PRESETS: readonly AppearancePreset[] = [
  preset("tfl-original", "TFL Original", "dark", "blue", "dot"),
  preset("midnight", "Midnight", "dark", "slate", "prism", "outfit"),
  preset("sakura", "Sakura", "dark", "pink", "ghost-fibers", "nunito"),
  preset("cyber", "Cyber", "dark", "cyan", "crt-warp", "chakra"),
  preset("frost", "Frost", "light", "sky", "shading", "rubik"),
  preset("aurora", "Aurora", "dark", "teal", "gradient-waves", "outfit"),
  preset("ember", "Ember", "dark", "orange", "molten-metal", "fredoka"),
  preset("minimal", "Minimal", "light", "slate", "solid"),
];
