import type { StudioAnimatedBackgroundId, StudioBackgroundId } from "./config";

export const COMPOSITION_CONTROLS = {
  blur: { min: 0, max: 12, step: 0.5, default: 0, unit: "px" },
  darken: { min: 0, max: 0.8, step: 0.05, default: 0, unit: "" },
  brightness: { min: 0.5, max: 1.5, step: 0.05, default: 1, unit: "×" },
  saturation: { min: 0, max: 2, step: 0.05, default: 1, unit: "×" },
  vignette: { min: 0, max: 0.8, step: 0.05, default: 0, unit: "" },
  opacity: { min: 0.1, max: 1, step: 0.05, default: 1, unit: "" },
} as const;
export type CompositionKey = keyof typeof COMPOSITION_CONTROLS;
export type BackgroundComposition = Record<CompositionKey, number>;
export const DEFAULT_COMPOSITION: BackgroundComposition = {
  blur: 0, darken: 0, brightness: 1, saturation: 1, vignette: 0, opacity: 1,
};

export type BackgroundControl = {
  key: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: string;
  type?: "range" | "toggle";
  category?: "backgrounds";
  labelKey?: string;
  reset?: "default";
  supportedThemes?: readonly ["dark"];
};
const control = (key: string, value: number, min: number, max: number, step: number): BackgroundControl =>
  ({ key, default: value, min, max, step, category: "backgrounds", labelKey: key, reset: "default", supportedThemes: ["dark"],
    type: ["mouseReact", "mouseInteraction", "enableMouseInteraction"].includes(key) ? "toggle" : "range" });

/** Only supported props are exposed. Defaults reproduce the v0.18 renderer. */
export const BACKGROUND_CAPABILITIES: Record<StudioAnimatedBackgroundId, readonly BackgroundControl[]> = {
  silk: [control("speed", 5, 0, 10, 0.25), control("scale", 1, 0.5, 3, 0.1), { ...control("rotation", 0, -3.1, 3.1, 0.1), unit: "rad" }, control("noiseIntensity", 1.5, 0, 3, 0.1)],
  "ghost-fibers": [control("speed", 0.2, 0, 1, 0.05), control("scale", 2, 1, 5, 0.1), control("rotation", 0, -180, 180, 5), control("glowIntensity", 1.6, 0.2, 3, 0.1)],
  "crt-warp": [control("speed", 0.5, 0, 2, 0.05), control("curvature", 0.25, 0, 0.6, 0.05), control("scanlineStrength", 0.25, 0, 0.6, 0.05), control("bloom", 1.5, 0, 2.5, 0.1), control("mouseReact", 1, 0, 1, 1)],
  "molten-metal": [control("speed", 0.35, 0, 1.5, 0.05), control("scale", 4, 1, 8, 0.25), control("glow", 1.6, 0.2, 3, 0.1), control("swirl", 1, 0, 2, 0.1)],
  "gradient-waves": [control("speed", 0.4, 0, 1.5, 0.05), control("amplitude", 2.5, 0.5, 4, 0.1), control("zoom", 1, 0.5, 2, 0.1), control("mouseInteraction", 1, 0, 1, 1)],
  prism: [control("timeScale", 0.5, 0, 1.5, 0.05), control("scale", 3.6, 1, 6, 0.1), control("glow", 1, 0.2, 2, 0.1), control("noise", 0, 0, 0.2, 0.01)],
  "line-waves": [control("speed", 0.3, 0, 1.5, 0.05), control("warpIntensity", 1, 0, 2, 0.1), control("rotation", -45, -180, 180, 5), control("enableMouseInteraction", 1, 0, 1, 1)],
};
export type BackgroundSettings = Partial<Record<StudioAnimatedBackgroundId, Record<string, number>>>;

export function boundedNumber(value: unknown, definition: { min: number; max: number; default: number; step?: number }) {
  if (typeof value !== "number" || !Number.isFinite(value)) return definition.default;
  const bounded = Math.min(definition.max, Math.max(definition.min, value));
  return definition.step ? Number((Math.round((bounded - definition.min) / definition.step) * definition.step + definition.min).toFixed(6)) : bounded;
}
export function sanitizeComposition(value: unknown): BackgroundComposition {
  const candidate = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(COMPOSITION_CONTROLS).map(([key, definition]) =>
    [key, boundedNumber(candidate[key], definition)])) as BackgroundComposition;
}
export function backgroundControls(background: StudioBackgroundId): readonly BackgroundControl[] {
  return BACKGROUND_CAPABILITIES[background as StudioAnimatedBackgroundId] ?? [];
}
export function sanitizeBackgroundSettings(value: unknown): BackgroundSettings {
  if (!value || typeof value !== "object") return {};
  const settings: BackgroundSettings = {};
  for (const [background, controls] of Object.entries(BACKGROUND_CAPABILITIES)) {
    const candidate = (value as Record<string, unknown>)[background];
    if (!candidate || typeof candidate !== "object") continue;
    settings[background as StudioAnimatedBackgroundId] = Object.fromEntries(controls.map((definition) =>
      [definition.key, boundedNumber((candidate as Record<string, unknown>)[definition.key], definition)]));
  }
  return settings;
}
export function backgroundValues(background: StudioBackgroundId, settings: BackgroundSettings) {
  const saved = settings[background as StudioAnimatedBackgroundId];
  return Object.fromEntries(backgroundControls(background).map((definition) =>
    [definition.key, boundedNumber(saved?.[definition.key], definition)]));
}
