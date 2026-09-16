export type StudioCursorId =
  | "system"
  | "prism-glass"
  | "aurora-glass"
  | "sakura-glass"
  | "obsidian-glass"
  | "frost-glass"
  | "ember-glass"
  | "cyber-glass"
  | "mono-glass";

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
};

export type StudioCursorPack = {
  id: StudioCursorId;
  label: string;
  descriptionKey: Exclude<StudioCursorId, "system"> | "system";
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

const frameSequence = (pack: string, role: StudioCursorRole, count: number) =>
  Array.from({ length: count }, (_, index) =>
    `/cursors/tfl/${pack}/${role}-${String(index).padStart(2, "0")}.cur`,
  );

function tflPack({
  id,
  label,
  animated,
  intervalMs,
}: {
  id: Exclude<StudioCursorId, "system">;
  label: string;
  animated: boolean;
  intervalMs: number;
}): StudioCursorPack {
  const animatedFrames = animated ? 8 : 1;
  return {
    id,
    label,
    descriptionKey: id,
    preview: `/cursors/tfl/${id}/preview.png`,
    animated,
    roles: {
      default: { frames: frameSequence(id, "default", animatedFrames), intervalMs },
      pointer: { frames: frameSequence(id, "pointer", animatedFrames), intervalMs },
      text: { frames: frameSequence(id, "text", animatedFrames), intervalMs },
      help: { frames: frameSequence(id, "help", 1) },
      wait: { frames: frameSequence(id, "wait", animated ? 12 : 1), intervalMs: 72 },
      progress: { frames: frameSequence(id, "progress", animated ? 12 : 1), intervalMs: 72 },
      grab: { frames: frameSequence(id, "grab", 1) },
      grabbing: { frames: frameSequence(id, "grabbing", 1) },
      move: { frames: frameSequence(id, "move", 1) },
      precision: { frames: frameSequence(id, "precision", 1) },
      "not-allowed": { frames: frameSequence(id, "not-allowed", 1) },
      "ew-resize": { frames: frameSequence(id, "ew-resize", 1) },
      "ns-resize": { frames: frameSequence(id, "ns-resize", 1) },
      "nwse-resize": { frames: frameSequence(id, "nwse-resize", 1) },
      "nesw-resize": { frames: frameSequence(id, "nesw-resize", 1) },
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
  tflPack({ id: "prism-glass", label: "TFL Prism Glass", animated: true, intervalMs: 90 }),
  tflPack({ id: "aurora-glass", label: "Aurora Glass", animated: true, intervalMs: 110 }),
  tflPack({ id: "sakura-glass", label: "Sakura Glass", animated: true, intervalMs: 125 }),
  tflPack({ id: "obsidian-glass", label: "Obsidian Glass", animated: false, intervalMs: 0 }),
  tflPack({ id: "frost-glass", label: "Frost Crystal", animated: true, intervalMs: 135 }),
  tflPack({ id: "ember-glass", label: "Ember Glass", animated: true, intervalMs: 95 }),
  tflPack({ id: "cyber-glass", label: "Cyber Glass", animated: true, intervalMs: 100 }),
  tflPack({ id: "mono-glass", label: "Mono Glass", animated: false, intervalMs: 0 }),
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

export function isStudioCursor(value: unknown): value is StudioCursorId {
  return STUDIO_CURSOR_PACKS.some((pack) => pack.id === value);
}

export function getCursorFrame(
  pack: StudioCursorPack,
  role: StudioCursorRole,
  elapsedMs = 0,
): string | null {
  const definition = pack.roles[role] ?? pack.roles.default;
  if (!definition?.frames.length) return null;
  if (definition.frames.length === 1) return definition.frames[0];
  const interval = Math.max(40, definition.intervalMs ?? 100);
  return definition.frames[Math.floor(elapsedMs / interval) % definition.frames.length];
}

export function getCursorCssValue(
  pack: StudioCursorPack,
  role: StudioCursorRole,
  elapsedMs = 0,
) {
  const frame = getCursorFrame(pack, role, elapsedMs);
  const fallback = CURSOR_FALLBACKS[role];
  return frame ? `url("${frame}"), ${fallback}` : fallback;
}
