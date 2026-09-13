export type StudioAccentId =
  | "blue"
  | "slate"
  | "rose"
  | "orange"
  | "red"
  | "violet"
  | "cyan"
  | "emerald"
  | "fuchsia";

export type StudioFontId = "tfl" | "nunito" | "vt323" | "outfit" | "fredoka";

export type StudioBackgroundId =
  | "grid"
  | "halo"
  | "mesh"
  | "clean"
  | "silk"
  | "ghost-fibers"
  | "crt-warp"
  | "molten-metal"
  | "gradient-waves"
  | "prism"
  | "line-waves";

export type StudioPreferences = {
  accent: StudioAccentId;
  font: StudioFontId;
  background: StudioBackgroundId;
};

export const DEFAULT_STUDIO_PREFERENCES: StudioPreferences = {
  accent: "blue",
  font: "tfl",
  background: "grid",
};

export const STUDIO_STORAGE_KEY = "tflives-studio-v1";

export const STUDIO_ACCENTS: Array<{
  id: StudioAccentId;
  label: string;
  color: string;
}> = [
  { id: "blue", label: "Blue", color: "#3b82f6" },
  { id: "slate", label: "Slate", color: "#64748b" },
  { id: "rose", label: "Rose intense", color: "#f43f5e" },
  { id: "orange", label: "Orange", color: "#f97316" },
  { id: "red", label: "Red", color: "#ef4444" },
  { id: "violet", label: "Violet", color: "#8b5cf6" },
  { id: "cyan", label: "Cyan", color: "#06b6d4" },
  { id: "emerald", label: "Emerald", color: "#10b981" },
  { id: "fuchsia", label: "Fuchsia", color: "#d946ef" },
];

export const STUDIO_FONTS: Array<{
  id: StudioFontId;
  label: string;
  cssVar: string;
  descriptionKey: "tfl" | "nunito" | "vt323" | "outfit" | "fredoka";
}> = [
  {
    id: "tfl",
    label: "TFL Original",
    cssVar: "var(--font-space-grotesk)",
    descriptionKey: "tfl",
  },
  {
    id: "nunito",
    label: "Nunito",
    cssVar: "var(--font-nunito)",
    descriptionKey: "nunito",
  },
  {
    id: "vt323",
    label: "VT323",
    cssVar: "var(--font-vt323)",
    descriptionKey: "vt323",
  },
  {
    id: "outfit",
    label: "Outfit",
    cssVar: "var(--font-outfit)",
    descriptionKey: "outfit",
  },
  {
    id: "fredoka",
    label: "Fredoka",
    cssVar: "var(--font-fredoka)",
    descriptionKey: "fredoka",
  },
];

export const STUDIO_STATIC_BACKGROUNDS: Array<{
  id: StudioBackgroundId;
  labelKey: "grid" | "halo" | "mesh" | "clean";
}> = [
  { id: "grid", labelKey: "grid" },
  { id: "halo", labelKey: "halo" },
  { id: "mesh", labelKey: "mesh" },
  { id: "clean", labelKey: "clean" },
];

export const STUDIO_ANIMATED_BACKGROUNDS: Array<{
  id: StudioBackgroundId;
  label: string;
  reference: string;
}> = [
  { id: "silk", label: "Silk", reference: "https://reactbits.dev/backgrounds/silk" },
  {
    id: "ghost-fibers",
    label: "Ghost Fibers",
    reference: "https://reactbits.dev/backgrounds/ghost-fibers",
  },
  { id: "crt-warp", label: "CRT Warp", reference: "https://reactbits.dev/backgrounds/crt-warp" },
  {
    id: "molten-metal",
    label: "Molten Metal",
    reference: "https://reactbits.dev/backgrounds/molten-metal",
  },
  {
    id: "gradient-waves",
    label: "Gradient Waves",
    reference: "https://reactbits.dev/backgrounds/gradient-waves",
  },
  { id: "prism", label: "Prism", reference: "https://reactbits.dev/backgrounds/prism" },
  {
    id: "line-waves",
    label: "Line Waves",
    reference: "https://reactbits.dev/backgrounds/line-waves",
  },
];

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
