export type StudioCursorId =
  | "system"
  | "prism-glass"
  | "aurora-glass"
  | "obsidian-glass"
  | "frost-glass";

export type StudioCursorRole =
  | "default"
  | "pointer"
  | "text"
  | "help"
  | "wait"
  | "progress"
  | "grab"
  | "grabbing"
  | "move"
  | "precision"
  | "not-allowed"
  | "ew-resize"
  | "ns-resize"
  | "nwse-resize"
  | "nesw-resize";

type CursorRoleDefinition = {
  frames: string[];
  intervalMs?: number;
  hotspot?: readonly [number, number];
};

export type StudioCursorPack = {
  id: StudioCursorId;
  label: string;
  descriptionKey: StudioCursorId;
  preview?: string;
  animated: boolean;
  roles: Partial<Record<StudioCursorRole, CursorRoleDefinition>>;
};

const CURSOR_FALLBACKS: Record<StudioCursorRole, string> = {
  default: "default",
  pointer: "pointer",
  text: "text",
  help: "help",
  wait: "wait",
  progress: "progress",
  grab: "grab",
  grabbing: "grabbing",
  move: "move",
  precision: "crosshair",
  "not-allowed": "not-allowed",
  "ew-resize": "ew-resize",
  "ns-resize": "ns-resize",
  "nwse-resize": "nwse-resize",
  "nesw-resize": "nesw-resize",
};

const CURSOR_HOTSPOTS: Record<StudioCursorRole, readonly [number, number]> = {
  default: [4, 3],
  pointer: [17, 5],
  text: [20, 20],
  help: [4, 3],
  wait: [20, 20],
  progress: [4, 3],
  grab: [20, 20],
  grabbing: [20, 20],
  move: [20, 20],
  precision: [20, 20],
  "not-allowed": [20, 20],
  "ew-resize": [20, 20],
  "ns-resize": [20, 20],
  "nwse-resize": [20, 20],
  "nesw-resize": [20, 20],
};

const LEGACY_CURSOR_ALIASES: Record<string, StudioCursorId> = {
  "sakura-glass": "prism-glass",
  "ember-glass": "prism-glass",
  "cyber-glass": "aurora-glass",
  "mono-glass": "frost-glass",
};

const frameSequence = (pack: string, role: StudioCursorRole, count: number) =>
  Array.from({ length: count }, (_, index) =>
    `/cursors/tfl/${pack}/${role}-${String(index).padStart(2, "0")}.cur`,
  );

function glassPack({
  id,
  label,
}: {
  id: Exclude<StudioCursorId, "system">;
  label: string;
}): StudioCursorPack {
  const staticRole = (role: StudioCursorRole): CursorRoleDefinition => ({
    frames: frameSequence(id, role, 1),
    hotspot: CURSOR_HOTSPOTS[role],
  });

  return {
    id,
    label,
    descriptionKey: id,
    preview: `/cursors/tfl/${id}/preview.png`,
    // Everyday roles stay completely stable. Only genuine status cursors animate,
    // matching desktop cursor behavior without repainting the pointer constantly.
    animated: true,
    roles: {
      default: staticRole("default"),
      pointer: staticRole("pointer"),
      text: staticRole("text"),
      help: staticRole("help"),
      wait: {
        frames: frameSequence(id, "wait", 8),
        intervalMs: 92,
        hotspot: CURSOR_HOTSPOTS.wait,
      },
      progress: {
        frames: frameSequence(id, "progress", 8),
        intervalMs: 92,
        hotspot: CURSOR_HOTSPOTS.progress,
      },
      grab: staticRole("grab"),
      grabbing: staticRole("grabbing"),
      move: staticRole("move"),
      precision: staticRole("precision"),
      "not-allowed": staticRole("not-allowed"),
      "ew-resize": staticRole("ew-resize"),
      "ns-resize": staticRole("ns-resize"),
      "nwse-resize": staticRole("nwse-resize"),
      "nesw-resize": staticRole("nesw-resize"),
    },
  };
}

export const STUDIO_CURSOR_PACKS: StudioCursorPack[] = [
  {
    id: "system",
    label: "System",
    descriptionKey: "system",
    animated: false,
    roles: {},
  },
  glassPack({ id: "prism-glass", label: "TFL Prism Glass" }),
  glassPack({ id: "frost-glass", label: "TFL Clear Glass" }),
  glassPack({ id: "aurora-glass", label: "TFL Liquid Glass" }),
  glassPack({ id: "obsidian-glass", label: "TFL Midnight Glass" }),
];

export const STUDIO_CURSOR_ROLES: StudioCursorRole[] = [
  "default",
  "pointer",
  "text",
  "help",
  "wait",
  "progress",
  "grab",
  "grabbing",
  "move",
  "precision",
  "not-allowed",
  "ew-resize",
  "ns-resize",
  "nwse-resize",
  "nesw-resize",
];

export function getStudioCursorPack(id: StudioCursorId) {
  return STUDIO_CURSOR_PACKS.find((pack) => pack.id === id) ?? STUDIO_CURSOR_PACKS[0];
}

export function normalizeStudioCursor(value: unknown): StudioCursorId {
  if (typeof value !== "string") return "system";
  if (STUDIO_CURSOR_PACKS.some((pack) => pack.id === value)) return value as StudioCursorId;
  return LEGACY_CURSOR_ALIASES[value] ?? "system";
}

export function isStudioCursor(value: unknown): value is StudioCursorId {
  return typeof value === "string" && STUDIO_CURSOR_PACKS.some((pack) => pack.id === value);
}

export function getCursorFrame(
  pack: StudioCursorPack,
  role: StudioCursorRole,
  elapsedMs = 0,
): string | null {
  const definition = pack.roles[role] ?? pack.roles.default;
  if (!definition?.frames.length) return null;
  if (definition.frames.length === 1) return definition.frames[0];
  const interval = Math.max(60, definition.intervalMs ?? 100);
  return definition.frames[Math.floor(elapsedMs / interval) % definition.frames.length];
}

export function getCursorCssValue(
  pack: StudioCursorPack,
  role: StudioCursorRole,
  elapsedMs = 0,
) {
  const definition = pack.roles[role] ?? pack.roles.default;
  const frame = getCursorFrame(pack, role, elapsedMs);
  const fallback = CURSOR_FALLBACKS[role];
  if (!frame) return fallback;

  const hotspot = definition?.hotspot;
  return hotspot
    ? `url("${frame}") ${hotspot[0]} ${hotspot[1]}, ${fallback}`
    : `url("${frame}"), ${fallback}`;
}

export function getCursorAnimationInterval(pack: StudioCursorPack) {
  const intervals = Object.values(pack.roles)
    .filter((definition): definition is CursorRoleDefinition => Boolean(definition?.frames.length && definition.frames.length > 1))
    .map((definition) => Math.max(60, definition.intervalMs ?? 100));

  return intervals.length ? Math.min(...intervals) : null;
}
