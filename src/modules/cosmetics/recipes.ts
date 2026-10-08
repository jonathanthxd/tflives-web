import { COSMETIC_PRESETS, isVisualPreset, type CosmeticVisualPresetKey } from "./visuals";

export const AVATAR_FRAME_LAYERS = ["aura", "motif", "signature", "orbit", "particles", "ambient", "ornament"] as const;
export type AvatarFrameLayer = (typeof AVATAR_FRAME_LAYERS)[number];
export type FrameMotion = "metal-shimmer" | "wave" | "pulse" | "crystal" | "circuit" | "embers" | "toxic" | "refraction" | "grid" | "petals" | "void" | "solar" | "royal" | "nebula" | "galaxy";
type FrameSemantics = { details: number; motion: FrameMotion; silhouette: "ring" | "ornamented" | "crystalline" | "organic" };
const FRAME_SEMANTICS: Record<string, FrameSemantics> = {
  metal: { details: 6, motion: "metal-shimmer", silhouette: "ring" },
  mono: { details: 6, motion: "metal-shimmer", silhouette: "ring" },
  wave: { details: 9, motion: "wave", silhouette: "organic" },
  pulse: { details: 6, motion: "pulse", silhouette: "ring" },
  frost: { details: 9, motion: "crystal", silhouette: "crystalline" },
  circuit: { details: 10, motion: "circuit", silhouette: "ornamented" },
  flame: { details: 10, motion: "embers", silhouette: "organic" },
  toxic: { details: 10, motion: "toxic", silhouette: "organic" },
  prism: { details: 10, motion: "refraction", silhouette: "crystalline" },
  grid: { details: 9, motion: "grid", silhouette: "ornamented" },
  petal: { details: 18, motion: "petals", silhouette: "organic" },
  void: { details: 9, motion: "void", silhouette: "ring" },
  flare: { details: 10, motion: "solar", silhouette: "organic" },
  royal: { details: 10, motion: "royal", silhouette: "ornamented" },
  nebula: { details: 10, motion: "nebula", silhouette: "organic" },
  galaxy: { details: 10, motion: "galaxy", silhouette: "ornamented" },
};
export type AvatarFrameRecipe = FrameSemantics & {
  preset: CosmeticVisualPresetKey;
  layers: readonly AvatarFrameLayer[];
  cssVariant: string;
  colors: readonly [string, string, string];
  resources: "css";
  priority: "identity";
};
/** Registry is code-defined. Database/user input remains an allowlisted preset ID. */
export const AVATAR_FRAME_RECIPES = Object.fromEntries(Object.entries(COSMETIC_PRESETS)
  .filter(([, definition]) => definition.type === "AVATAR_FRAME")
  .map(([preset, definition]) => {
    const semantics = FRAME_SEMANTICS[definition.variant];
    if (!semantics) throw new Error(`Missing controlled frame semantics: ${preset}`);
    return [preset, { ...semantics, preset, layers: AVATAR_FRAME_LAYERS, cssVariant: definition.variant,
      colors: definition.colors, resources: "css", priority: "identity" }];
  })) as Partial<Record<CosmeticVisualPresetKey, AvatarFrameRecipe>>;

export function avatarFrameRecipe(value: unknown): AvatarFrameRecipe | null {
  return isVisualPreset(value) ? AVATAR_FRAME_RECIPES[value] ?? null : null;
}
export function cosmeticRecipe(value: unknown) {
  if (!isVisualPreset(value)) return null;
  const definition = COSMETIC_PRESETS[value];
  return { preset: value, ...definition, renderer: "css" as const,
    capabilities: definition.type === "AVATAR_FRAME" ? avatarFrameRecipe(value) : {
      layer: definition.type, cssVariant: definition.variant, resources: "css" as const,
    } };
}
