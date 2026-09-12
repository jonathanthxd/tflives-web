/**
 * The complete visual allowlist for v0.8. Database values are validated against
 * this map before rendering, so neither admins nor clients can introduce CSS,
 * markup, scripts, URLs, or arbitrary SVG into a profile.
 */
export const COSMETIC_TYPES = [
  "AVATAR_FRAME",
  "PROFILE_ACCENT",
  "PROFILE_BADGE",
  "NAMEPLATE",
  "BANNER_STYLE",
] as const;

export const COSMETIC_RARITIES = ["COMMON", "RARE", "EPIC", "LEGENDARY"] as const;

export const COSMETIC_PRESETS = {
  BRONZE_FRAME: { type: "AVATAR_FRAME", preview: "ring-amber-500/70", badge: null },
  PRISM_FRAME: { type: "AVATAR_FRAME", preview: "ring-violet-400/80", badge: null },
  AURORA_ACCENT: { type: "PROFILE_ACCENT", preview: "bg-cyan-400", badge: null },
  AMBER_ACCENT: { type: "PROFILE_ACCENT", preview: "bg-amber-400", badge: null },
  STAR_BADGE: { type: "PROFILE_BADGE", preview: "bg-sky-400", badge: "✦" },
  CROWN_BADGE: { type: "PROFILE_BADGE", preview: "bg-amber-400", badge: "♛" },
  VIOLET_NAMEPLATE: { type: "NAMEPLATE", preview: "bg-violet-400", badge: null },
  SUNSET_BANNER: { type: "BANNER_STYLE", preview: "bg-orange-400", badge: null },
} as const;

export type CosmeticTypeKey = (typeof COSMETIC_TYPES)[number];
export type CosmeticRarityKey = (typeof COSMETIC_RARITIES)[number];
export type CosmeticVisualPresetKey = keyof typeof COSMETIC_PRESETS;

export interface SafeCosmeticVisual {
  type: CosmeticTypeKey;
  visualPreset: CosmeticVisualPresetKey;
}

export function isCosmeticType(value: unknown): value is CosmeticTypeKey {
  return typeof value === "string" && COSMETIC_TYPES.includes(value as CosmeticTypeKey);
}

export function isCosmeticRarity(value: unknown): value is CosmeticRarityKey {
  return typeof value === "string" && COSMETIC_RARITIES.includes(value as CosmeticRarityKey);
}

export function isVisualPreset(value: unknown): value is CosmeticVisualPresetKey {
  return typeof value === "string" && value in COSMETIC_PRESETS;
}

export function isPresetForType(type: unknown, visualPreset: unknown): boolean {
  return isCosmeticType(type) && isVisualPreset(visualPreset) && COSMETIC_PRESETS[visualPreset].type === type;
}

export function toSafeCosmeticVisual(value: unknown): SafeCosmeticVisual | null {
  if (!value || typeof value !== "object") return null;
  const { type, visualPreset } = value as { type?: unknown; visualPreset?: unknown };
  if (!isCosmeticType(type) || !isVisualPreset(visualPreset) || !isPresetForType(type, visualPreset)) return null;
  return { type, visualPreset };
}

export function cosmeticVisualsByType(values: unknown): Partial<Record<CosmeticTypeKey, SafeCosmeticVisual>> {
  if (!Array.isArray(values)) return {};
  return values.reduce<Partial<Record<CosmeticTypeKey, SafeCosmeticVisual>>>((result, candidate) => {
    const visual = toSafeCosmeticVisual(candidate);
    if (visual) result[visual.type] = visual;
    return result;
  }, {});
}

export function avatarFrameClass(preset?: CosmeticVisualPresetKey) {
  if (preset === "BRONZE_FRAME") return "ring-4 ring-amber-500/75 shadow-[0_0_0_4px_hsl(var(--card)),0_0_26px_rgba(245,158,11,.30)]";
  if (preset === "PRISM_FRAME") return "ring-4 ring-violet-400/80 shadow-[0_0_0_4px_hsl(var(--card)),0_0_26px_rgba(167,139,250,.45)]";
  return "";
}

export function accentClass(preset?: CosmeticVisualPresetKey) {
  if (preset === "AURORA_ACCENT") return "border-cyan-400/45 shadow-[0_20px_60px_-30px_rgba(34,211,238,.35)]";
  if (preset === "AMBER_ACCENT") return "border-amber-400/45 shadow-[0_20px_60px_-30px_rgba(251,191,36,.35)]";
  return "";
}

export function nameplateClass(preset?: CosmeticVisualPresetKey) {
  return preset === "VIOLET_NAMEPLATE"
    ? "rounded-lg bg-violet-500/12 px-2.5 py-1 text-violet-950 dark:text-violet-100"
    : "";
}

export function bannerClass(preset?: CosmeticVisualPresetKey) {
  return preset === "SUNSET_BANNER"
    ? "bg-[linear-gradient(135deg,rgba(249,115,22,.52),rgba(236,72,153,.34),rgba(79,70,229,.42))]"
    : "";
}
