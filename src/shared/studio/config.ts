import type { StudioCursorId } from "@/shared/studio/cursors";

export type StudioAccentId =
  | "blue"
  | "slate"
  | "rose"
  | "orange"
  | "red"
  | "violet"
  | "cyan"
  | "emerald"
  | "fuchsia"
  | "indigo"
  | "pink"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "teal"
  | "sky";

export type StudioFontId =
  | "tfl"
  | "nunito"
  | "vt323"
  | "outfit"
  | "fredoka"
  | "pixelify"
  | "chakra"
  | "quicksand"
  | "rubik";

export type StudioStaticBackgroundId = "dot" | "shading" | "solid";

export type StudioAnimatedBackgroundId =
  | "silk"
  | "ghost-fibers"
  | "crt-warp"
  | "molten-metal"
  | "gradient-waves"
  | "prism"
  | "line-waves";

export type StudioBackgroundId = StudioStaticBackgroundId | StudioAnimatedBackgroundId;

export type StudioPreferences = {
  accent: StudioAccentId;
  font: StudioFontId;
  background: StudioBackgroundId;
  cursor: StudioCursorId;
};

export const DEFAULT_STUDIO_PREFERENCES: StudioPreferences = {
  accent: "blue",
  font: "tfl",
  background: "dot",
  cursor: "system",
};

export const STUDIO_STORAGE_KEY = "tflives-studio-v1";

export const STUDIO_ACCENTS: Array<{
  id: StudioAccentId;
  label: string;
  color: string;
  secondary: string;
  tertiary: string;
  prismHueShift: number;
}> = [
  { id: "blue", label: "Blue", color: "#3b82f6", secondary: "#6366f1", tertiary: "#06b6d4", prismHueShift: 4.1 },
  { id: "slate", label: "Slate", color: "#64748b", secondary: "#818cf8", tertiary: "#94a3b8", prismHueShift: 3.7 },
  { id: "rose", label: "Rose intense", color: "#f43f5e", secondary: "#ec4899", tertiary: "#fb7185", prismHueShift: 0.45 },
  { id: "pink", label: "Pink", color: "#ec4899", secondary: "#f43f5e", tertiary: "#d946ef", prismHueShift: 0.28 },
  { id: "fuchsia", label: "Fuchsia", color: "#d946ef", secondary: "#ec4899", tertiary: "#8b5cf6", prismHueShift: -0.35 },
  { id: "violet", label: "Violet", color: "#8b5cf6", secondary: "#d946ef", tertiary: "#6366f1", prismHueShift: 0 },
  { id: "indigo", label: "Indigo", color: "#6366f1", secondary: "#8b5cf6", tertiary: "#3b82f6", prismHueShift: 4.75 },
  { id: "sky", label: "Sky", color: "#0ea5e9", secondary: "#06b6d4", tertiary: "#6366f1", prismHueShift: 3.55 },
  { id: "cyan", label: "Cyan", color: "#06b6d4", secondary: "#3b82f6", tertiary: "#10b981", prismHueShift: 3.25 },
  { id: "teal", label: "Teal", color: "#14b8a6", secondary: "#06b6d4", tertiary: "#22c55e", prismHueShift: 2.7 },
  { id: "emerald", label: "Emerald", color: "#10b981", secondary: "#06b6d4", tertiary: "#22c55e", prismHueShift: 2.35 },
  { id: "green", label: "Green", color: "#22c55e", secondary: "#10b981", tertiary: "#84cc16", prismHueShift: 2.05 },
  { id: "lime", label: "Lime", color: "#84cc16", secondary: "#22c55e", tertiary: "#eab308", prismHueShift: 1.72 },
  { id: "yellow", label: "Yellow", color: "#eab308", secondary: "#f59e0b", tertiary: "#84cc16", prismHueShift: 1.28 },
  { id: "amber", label: "Amber", color: "#f59e0b", secondary: "#f97316", tertiary: "#fde047", prismHueShift: 1.02 },
  { id: "orange", label: "Orange", color: "#f97316", secondary: "#facc15", tertiary: "#ef4444", prismHueShift: 1.05 },
  { id: "red", label: "Red", color: "#ef4444", secondary: "#f43f5e", tertiary: "#f97316", prismHueShift: 0.15 },
];

export const STUDIO_FONTS: Array<{
  id: StudioFontId;
  label: string;
  cssVar: string;
  descriptionKey: StudioFontId;
  sizeAdjust?: string;
}> = [
  { id: "tfl", label: "TFL Original", cssVar: "var(--font-space-grotesk)", descriptionKey: "tfl" },
  { id: "nunito", label: "Nunito", cssVar: "var(--font-nunito)", descriptionKey: "nunito" },
  { id: "vt323", label: "VT323", cssVar: "var(--font-vt323)", descriptionKey: "vt323", sizeAdjust: "0.66" },
  { id: "outfit", label: "Outfit", cssVar: "var(--font-outfit)", descriptionKey: "outfit" },
  { id: "fredoka", label: "Fredoka", cssVar: "var(--font-fredoka)", descriptionKey: "fredoka" },
  { id: "pixelify", label: "Pixelify Sans", cssVar: "var(--font-pixelify)", descriptionKey: "pixelify", sizeAdjust: "0.59" },
  { id: "chakra", label: "Chakra Petch", cssVar: "var(--font-chakra)", descriptionKey: "chakra" },
  { id: "quicksand", label: "Quicksand", cssVar: "var(--font-quicksand)", descriptionKey: "quicksand" },
  { id: "rubik", label: "Rubik", cssVar: "var(--font-rubik)", descriptionKey: "rubik" },
];

export const STUDIO_STATIC_BACKGROUNDS: Array<{
  id: StudioStaticBackgroundId;
  labelKey: "dot" | "shading" | "solid";
}> = [
  { id: "dot", labelKey: "dot" },
  { id: "shading", labelKey: "shading" },
  { id: "solid", labelKey: "solid" },
];

export const STUDIO_ANIMATED_BACKGROUNDS: Array<{
  id: StudioAnimatedBackgroundId;
  label: string;
  reference: string;
}> = [
  { id: "silk", label: "Silk", reference: "https://reactbits.dev/backgrounds/silk" },
  { id: "ghost-fibers", label: "Ghost Fibers", reference: "https://reactbits.dev/backgrounds/ghost-fibers" },
  { id: "crt-warp", label: "CRT Warp", reference: "https://reactbits.dev/backgrounds/crt-warp" },
  { id: "molten-metal", label: "Molten Metal", reference: "https://reactbits.dev/backgrounds/molten-metal" },
  { id: "gradient-waves", label: "Gradient Waves", reference: "https://reactbits.dev/backgrounds/gradient-waves" },
  { id: "prism", label: "Prism", reference: "https://reactbits.dev/backgrounds/prism" },
  { id: "line-waves", label: "Line Waves", reference: "https://reactbits.dev/backgrounds/line-waves" },
];

export function getStudioAccent(accent: StudioAccentId) {
  return STUDIO_ACCENTS.find((item) => item.id === accent) ?? STUDIO_ACCENTS[0];
}

export function isStudioAccent(value: unknown): value is StudioAccentId {
  return STUDIO_ACCENTS.some((accent) => accent.id === value);
}

export function isStudioFont(value: unknown): value is StudioFontId {
  return STUDIO_FONTS.some((font) => font.id === value);
}

export function isStudioBackground(value: unknown): value is StudioBackgroundId {
  return [...STUDIO_STATIC_BACKGROUNDS, ...STUDIO_ANIMATED_BACKGROUNDS].some(
    (background) => background.id === value,
  );
}

export function isAnimatedStudioBackground(
  value: StudioBackgroundId,
): value is StudioAnimatedBackgroundId {
  return STUDIO_ANIMATED_BACKGROUNDS.some((background) => background.id === value);
}
