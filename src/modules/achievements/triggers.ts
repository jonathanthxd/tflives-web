export const ACHIEVEMENT_TRIGGER_DEFINITIONS = {
  GLOBAL_MESSAGES: {
    label: "Mensajes en chat global",
    description: "Se obtiene al participar en el chat global de TFLives.",
    unit: "mensajes",
    kind: "count",
  },
  DIRECT_MESSAGES: {
    label: "Mensajes privados enviados",
    description: "Se obtiene al alcanzar cierta cantidad de mensajes privados enviados.",
    unit: "mensajes",
    kind: "count",
  },
  FRIENDSHIPS: {
    label: "Amistades",
    description: "Se obtiene al alcanzar cierta cantidad de amistades aceptadas.",
    unit: "amistades",
    kind: "count",
  },
  LEVEL: {
    label: "Nivel alcanzado",
    description: "Se obtiene cuando el miembro alcanza el nivel indicado.",
    unit: "nivel",
    kind: "count",
  },
  XP: {
    label: "Experiencia acumulada",
    description: "Se obtiene al alcanzar una cantidad total de XP.",
    unit: "XP",
    kind: "count",
  },
  PROFILE_COMPLETE: {
    label: "Perfil completado",
    description: "Se obtiene al completar la identidad básica del perfil.",
    unit: "completado",
    kind: "boolean",
  },
  EMAIL_VERIFIED: {
    label: "Correo verificado",
    description: "Se obtiene cuando la cuenta verifica su correo electrónico.",
    unit: "verificado",
    kind: "boolean",
  },
  OAUTH_CONNECTIONS: {
    label: "Cuentas conectadas",
    description: "Se obtiene al vincular proveedores como Google o Discord.",
    unit: "cuentas",
    kind: "count",
  },
} as const;

export type AchievementTriggerKey = keyof typeof ACHIEVEMENT_TRIGGER_DEFINITIONS;
export type AchievementUnlockModeKey = "MANUAL" | "AUTOMATIC";

export const ACHIEVEMENT_TRIGGER_KEYS = Object.keys(
  ACHIEVEMENT_TRIGGER_DEFINITIONS,
) as AchievementTriggerKey[];

export function isAchievementTrigger(value: unknown): value is AchievementTriggerKey {
  return typeof value === "string" && value in ACHIEVEMENT_TRIGGER_DEFINITIONS;
}

export function normalizedTriggerValue(trigger: AchievementTriggerKey, value: unknown) {
  const definition = ACHIEVEMENT_TRIGGER_DEFINITIONS[trigger];
  if (definition.kind === "boolean") return 1;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 1_000_000) return null;
  return numeric;
}

export function describeAchievementTrigger(trigger: AchievementTriggerKey, value: number) {
  const definition = ACHIEVEMENT_TRIGGER_DEFINITIONS[trigger];
  const formatted = value.toLocaleString("es-CO");
  if (definition.kind === "boolean") return definition.description;

  switch (trigger) {
    case "GLOBAL_MESSAGES":
      return `Se desbloquea automáticamente al alcanzar ${formatted} mensajes en el chat global.`;
    case "DIRECT_MESSAGES":
      return `Se desbloquea automáticamente al enviar ${formatted} mensajes privados.`;
    case "FRIENDSHIPS":
      return `Se desbloquea automáticamente al alcanzar ${formatted} amistades.`;
    case "LEVEL":
      return `Se desbloquea automáticamente al alcanzar el nivel ${formatted}.`;
    case "XP":
      return `Se desbloquea automáticamente al acumular ${formatted} XP.`;
    case "OAUTH_CONNECTIONS":
      return `Se desbloquea automáticamente al vincular ${formatted} cuenta${value === 1 ? "" : "s"}.`;
    default:
      return definition.description;
  }
}
