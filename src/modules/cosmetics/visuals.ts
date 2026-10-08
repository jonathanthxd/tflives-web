/**
 * Production cosmetic allowlist. All visuals are code-defined recipes; the database stores only
 * the preset key, so admins can never inject CSS, markup, scripts, URLs, or arbitrary SVG.
 */
export const COSMETIC_TYPES = [
  "AVATAR_FRAME",
  "PROFILE_ACCENT",
  "PROFILE_BADGE",
  "NAMEPLATE",
  "BANNER_STYLE",
] as const;
export const COSMETIC_RARITIES = ["COMMON", "RARE", "EPIC", "LEGENDARY"] as const;
export type CosmeticTypeKey = (typeof COSMETIC_TYPES)[number];
export type CosmeticRarityKey = (typeof COSMETIC_RARITIES)[number];
export interface CosmeticPresetDefinition {
  type: CosmeticTypeKey;
  preview: string;
  badge: string | null;
  colors: readonly [string, string, string];
  variant: string;
}
export const COSMETIC_PRESETS = {
  BRONZE_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #d97706, #fbbf24 52%, #78350f)", badge: null, colors: ["#d97706", "#fbbf24", "#78350f"], variant: "metal" },
  MONOCHROME_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #f8fafc, #94a3b8 52%, #0f172a)", badge: null, colors: ["#f8fafc", "#94a3b8", "#0f172a"], variant: "mono" },
  OCEAN_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #22d3ee, #2563eb 52%, #082f49)", badge: null, colors: ["#22d3ee", "#2563eb", "#082f49"], variant: "wave" },
  ROSE_PULSE_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #fb7185, #ec4899 52%, #881337)", badge: null, colors: ["#fb7185", "#ec4899", "#881337"], variant: "pulse" },
  FROST_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #e0f2fe, #7dd3fc 52%, #0369a1)", badge: null, colors: ["#e0f2fe", "#7dd3fc", "#0369a1"], variant: "frost" },
  EMERALD_CIRCUIT_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #34d399, #10b981 52%, #064e3b)", badge: null, colors: ["#34d399", "#10b981", "#064e3b"], variant: "circuit" },
  INFERNO_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #fb923c, #ef4444 52%, #7f1d1d)", badge: null, colors: ["#fb923c", "#ef4444", "#7f1d1d"], variant: "flame" },
  TOXIC_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #a3e635, #22c55e 52%, #14532d)", badge: null, colors: ["#a3e635", "#22c55e", "#14532d"], variant: "toxic" },
  PRISM_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #22d3ee, #a78bfa 52%, #f472b6)", badge: null, colors: ["#22d3ee", "#a78bfa", "#f472b6"], variant: "prism" },
  CYBERGRID_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #67e8f9, #3b82f6 52%, #1e1b4b)", badge: null, colors: ["#67e8f9", "#3b82f6", "#1e1b4b"], variant: "grid" },
  SAKURA_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #fda4af, #f9a8d4 52%, #831843)", badge: null, colors: ["#fda4af", "#f9a8d4", "#831843"], variant: "petal" },
  VOID_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #312e81, #7c3aed 52%, #020617)", badge: null, colors: ["#312e81", "#7c3aed", "#020617"], variant: "void" },
  SOLAR_FLARE_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #fde047, #f97316 52%, #991b1b)", badge: null, colors: ["#fde047", "#f97316", "#991b1b"], variant: "flare" },
  ROYAL_GOLD_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #facc15, #f59e0b 52%, #6b21a8)", badge: null, colors: ["#facc15", "#f59e0b", "#6b21a8"], variant: "royal" },
  NEBULA_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #818cf8, #c084fc 52%, #22d3ee)", badge: null, colors: ["#818cf8", "#c084fc", "#22d3ee"], variant: "nebula" },
  GALAXY_FRAME: { type: "AVATAR_FRAME", preview: "linear-gradient(135deg, #60a5fa, #a78bfa 52%, #f472b6)", badge: null, colors: ["#60a5fa", "#a78bfa", "#f472b6"], variant: "galaxy" },
  AURORA_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #22d3ee, #818cf8 52%, #ec4899)", badge: null, colors: ["#22d3ee", "#818cf8", "#ec4899"], variant: "aurora" },
  AMBER_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #fbbf24, #f97316 52%, #7c2d12)", badge: null, colors: ["#fbbf24", "#f97316", "#7c2d12"], variant: "halo" },
  MONOCHROME_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #f8fafc, #94a3b8 52%, #334155)", badge: null, colors: ["#f8fafc", "#94a3b8", "#334155"], variant: "edge" },
  COBALT_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #60a5fa, #2563eb 52%, #1e3a8a)", badge: null, colors: ["#60a5fa", "#2563eb", "#1e3a8a"], variant: "beam" },
  EMERALD_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #34d399, #10b981 52%, #064e3b)", badge: null, colors: ["#34d399", "#10b981", "#064e3b"], variant: "grid" },
  ROSE_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #fb7185, #ec4899 52%, #9f1239)", badge: null, colors: ["#fb7185", "#ec4899", "#9f1239"], variant: "bloom" },
  CRIMSON_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #f87171, #dc2626 52%, #7f1d1d)", badge: null, colors: ["#f87171", "#dc2626", "#7f1d1d"], variant: "slash" },
  FROST_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #e0f2fe, #38bdf8 52%, #0c4a6e)", badge: null, colors: ["#e0f2fe", "#38bdf8", "#0c4a6e"], variant: "frost" },
  SUNSET_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #fb923c, #ec4899 52%, #7c3aed)", badge: null, colors: ["#fb923c", "#ec4899", "#7c3aed"], variant: "sunset" },
  CYBER_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #22d3ee, #3b82f6 52%, #8b5cf6)", badge: null, colors: ["#22d3ee", "#3b82f6", "#8b5cf6"], variant: "circuit" },
  TOXIC_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #bef264, #22c55e 52%, #14532d)", badge: null, colors: ["#bef264", "#22c55e", "#14532d"], variant: "toxic" },
  OBSIDIAN_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #64748b, #312e81 52%, #020617)", badge: null, colors: ["#64748b", "#312e81", "#020617"], variant: "void" },
  SAKURA_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #fda4af, #f9a8d4 52%, #be185d)", badge: null, colors: ["#fda4af", "#f9a8d4", "#be185d"], variant: "petal" },
  ROYAL_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #facc15, #a855f7 52%, #4c1d95)", badge: null, colors: ["#facc15", "#a855f7", "#4c1d95"], variant: "royal" },
  PLASMA_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #22d3ee, #a855f7 52%, #f43f5e)", badge: null, colors: ["#22d3ee", "#a855f7", "#f43f5e"], variant: "plasma" },
  COSMIC_ACCENT: { type: "PROFILE_ACCENT", preview: "linear-gradient(135deg, #60a5fa, #a78bfa 52%, #f472b6)", badge: null, colors: ["#60a5fa", "#a78bfa", "#f472b6"], variant: "cosmic" },
  STAR_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #38bdf8, #2563eb 52%, #0c4a6e)", badge: "✦", colors: ["#38bdf8", "#2563eb", "#0c4a6e"], variant: "orb" },
  HEART_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #fb7185, #e11d48 52%, #881337)", badge: "♥", colors: ["#fb7185", "#e11d48", "#881337"], variant: "soft" },
  BOLT_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #fde047, #f59e0b 52%, #78350f)", badge: "ϟ", colors: ["#fde047", "#f59e0b", "#78350f"], variant: "energy" },
  MOON_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #c4b5fd, #6366f1 52%, #312e81)", badge: "☾", colors: ["#c4b5fd", "#6366f1", "#312e81"], variant: "night" },
  GEM_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #67e8f9, #8b5cf6 52%, #312e81)", badge: "◆", colors: ["#67e8f9", "#8b5cf6", "#312e81"], variant: "gem" },
  FLAME_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #fb923c, #ef4444 52%, #7f1d1d)", badge: "♨", colors: ["#fb923c", "#ef4444", "#7f1d1d"], variant: "energy" },
  SNOW_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #e0f2fe, #38bdf8 52%, #0369a1)", badge: "✣", colors: ["#e0f2fe", "#38bdf8", "#0369a1"], variant: "frost" },
  SUN_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #fde047, #f97316 52%, #9a3412)", badge: "☼", colors: ["#fde047", "#f97316", "#9a3412"], variant: "sun" },
  GHOST_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #e2e8f0, #8b5cf6 52%, #312e81)", badge: "◉", colors: ["#e2e8f0", "#8b5cf6", "#312e81"], variant: "ghost" },
  SWORD_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #cbd5e1, #64748b 52%, #0f172a)", badge: "†", colors: ["#cbd5e1", "#64748b", "#0f172a"], variant: "metal" },
  SHIELD_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #93c5fd, #2563eb 52%, #1e3a8a)", badge: "⬙", colors: ["#93c5fd", "#2563eb", "#1e3a8a"], variant: "metal" },
  SPARK_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #f0abfc, #ec4899 52%, #701a75)", badge: "✧", colors: ["#f0abfc", "#ec4899", "#701a75"], variant: "spark" },
  ORBIT_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #22d3ee, #6366f1 52%, #312e81)", badge: "⊙", colors: ["#22d3ee", "#6366f1", "#312e81"], variant: "orbit" },
  PIXEL_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #a3e635, #22c55e 52%, #052e16)", badge: "▣", colors: ["#a3e635", "#22c55e", "#052e16"], variant: "pixel" },
  DIAMOND_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #f8fafc, #67e8f9 52%, #7c3aed)", badge: "◇", colors: ["#f8fafc", "#67e8f9", "#7c3aed"], variant: "gem" },
  CROWN_BADGE: { type: "PROFILE_BADGE", preview: "linear-gradient(135deg, #fde047, #f59e0b 52%, #6b21a8)", badge: "♛", colors: ["#fde047", "#f59e0b", "#6b21a8"], variant: "royal" },
  VIOLET_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #a78bfa, #7c3aed 52%, #4c1d95)", badge: null, colors: ["#a78bfa", "#7c3aed", "#4c1d95"], variant: "solid" },
  NEON_CYAN_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #67e8f9, #06b6d4 52%, #164e63)", badge: null, colors: ["#67e8f9", "#06b6d4", "#164e63"], variant: "neon" },
  ROSE_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #fda4af, #ec4899 52%, #881337)", badge: null, colors: ["#fda4af", "#ec4899", "#881337"], variant: "soft" },
  EMERALD_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #6ee7b7, #10b981 52%, #064e3b)", badge: null, colors: ["#6ee7b7", "#10b981", "#064e3b"], variant: "glass" },
  FROST_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #f0f9ff, #7dd3fc 52%, #075985)", badge: null, colors: ["#f0f9ff", "#7dd3fc", "#075985"], variant: "frost" },
  INFERNO_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #fdba74, #ef4444 52%, #7f1d1d)", badge: null, colors: ["#fdba74", "#ef4444", "#7f1d1d"], variant: "flame" },
  MATRIX_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #bef264, #22c55e 52%, #052e16)", badge: null, colors: ["#bef264", "#22c55e", "#052e16"], variant: "matrix" },
  PIXEL_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #f8fafc, #38bdf8 52%, #0f172a)", badge: null, colors: ["#f8fafc", "#38bdf8", "#0f172a"], variant: "pixel" },
  MOLTEN_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #fde047, #f97316 52%, #991b1b)", badge: null, colors: ["#fde047", "#f97316", "#991b1b"], variant: "molten" },
  AURORA_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #22d3ee, #8b5cf6 52%, #ec4899)", badge: null, colors: ["#22d3ee", "#8b5cf6", "#ec4899"], variant: "aurora" },
  CHROME_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #ffffff, #94a3b8 52%, #0f172a)", badge: null, colors: ["#ffffff", "#94a3b8", "#0f172a"], variant: "chrome" },
  SUNSET_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #fdba74, #f472b6 52%, #7c3aed)", badge: null, colors: ["#fdba74", "#f472b6", "#7c3aed"], variant: "sunset" },
  ROYAL_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #fde047, #a855f7 52%, #4c1d95)", badge: null, colors: ["#fde047", "#a855f7", "#4c1d95"], variant: "royal" },
  VOID_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #94a3b8, #7c3aed 52%, #020617)", badge: null, colors: ["#94a3b8", "#7c3aed", "#020617"], variant: "void" },
  HOLOGRAPHIC_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #67e8f9, #f0abfc 52%, #fde68a)", badge: null, colors: ["#67e8f9", "#f0abfc", "#fde68a"], variant: "holo" },
  GALAXY_NAMEPLATE: { type: "NAMEPLATE", preview: "linear-gradient(135deg, #60a5fa, #a78bfa 52%, #f472b6)", badge: null, colors: ["#60a5fa", "#a78bfa", "#f472b6"], variant: "galaxy" },
  SUNSET_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #fb923c, #ec4899 52%, #4f46e5)", badge: null, colors: ["#fb923c", "#ec4899", "#4f46e5"], variant: "sunset" },
  GLASS_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #e2e8f0, #94a3b8 52%, #475569)", badge: null, colors: ["#e2e8f0", "#94a3b8", "#475569"], variant: "glass" },
  OCEAN_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #22d3ee, #2563eb 52%, #082f49)", badge: null, colors: ["#22d3ee", "#2563eb", "#082f49"], variant: "ocean" },
  SAKURA_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #fda4af, #f9a8d4 52%, #831843)", badge: null, colors: ["#fda4af", "#f9a8d4", "#831843"], variant: "sakura" },
  GRID_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #67e8f9, #3b82f6 52%, #172554)", badge: null, colors: ["#67e8f9", "#3b82f6", "#172554"], variant: "grid" },
  FROST_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #e0f2fe, #7dd3fc 52%, #075985)", badge: null, colors: ["#e0f2fe", "#7dd3fc", "#075985"], variant: "frost" },
  LIQUID_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #22d3ee, #8b5cf6 52%, #ec4899)", badge: null, colors: ["#22d3ee", "#8b5cf6", "#ec4899"], variant: "liquid" },
  CYBER_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #22d3ee, #2563eb 52%, #7c3aed)", badge: null, colors: ["#22d3ee", "#2563eb", "#7c3aed"], variant: "cyber" },
  AURORA_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #22d3ee, #8b5cf6 52%, #ec4899)", badge: null, colors: ["#22d3ee", "#8b5cf6", "#ec4899"], variant: "aurora" },
  NEBULA_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #60a5fa, #a78bfa 52%, #f472b6)", badge: null, colors: ["#60a5fa", "#a78bfa", "#f472b6"], variant: "nebula" },
  CRT_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #c084fc, #22d3ee 52%, #09090b)", badge: null, colors: ["#c084fc", "#22d3ee", "#09090b"], variant: "crt" },
  MOLTEN_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #fde047, #f97316 52%, #991b1b)", badge: null, colors: ["#fde047", "#f97316", "#991b1b"], variant: "molten" },
  PRISMATIC_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #22d3ee, #a78bfa 52%, #f472b6)", badge: null, colors: ["#22d3ee", "#a78bfa", "#f472b6"], variant: "prism" },
  STARFIELD_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #e2e8f0, #60a5fa 52%, #312e81)", badge: null, colors: ["#e2e8f0", "#60a5fa", "#312e81"], variant: "stars" },
  ROYAL_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #fde047, #a855f7 52%, #3b0764)", badge: null, colors: ["#fde047", "#a855f7", "#3b0764"], variant: "royal" },
  VOID_BANNER: { type: "BANNER_STYLE", preview: "linear-gradient(135deg, #64748b, #7c3aed 52%, #020617)", badge: null, colors: ["#64748b", "#7c3aed", "#020617"], variant: "void" },
} as const satisfies Record<string, CosmeticPresetDefinition>;
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
  return typeof value === "string" && Object.hasOwn(COSMETIC_PRESETS, value);
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

export function presetDefinition(preset?: CosmeticVisualPresetKey) {
  return preset ? COSMETIC_PRESETS[preset] : null;
}

export function presetCssVariables(preset?: CosmeticVisualPresetKey): Record<string, string> {
  const definition = presetDefinition(preset);
  if (!definition) return {};
  return {
    "--cosmetic-1": definition.colors[0],
    "--cosmetic-2": definition.colors[1],
    "--cosmetic-3": definition.colors[2],
  };
}
