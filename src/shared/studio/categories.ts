export const STUDIO_CATEGORIES = ["general", "colors", "backgrounds", "typography", "cursors", "cosmetics", "presets"] as const;
export type StudioCategory = (typeof STUDIO_CATEGORIES)[number];
