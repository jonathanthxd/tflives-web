/**
 * Total XP needed to enter a level. Level 1 starts at zero XP, level 2 at
 * 100 XP, level 3 at 400 XP, and so on. Keeping this formula here prevents
 * the profile and server from drifting apart.
 */
export function xpRequiredForLevel(level: number) {
  const safeLevel = Math.max(1, Math.floor(level));
  return 100 * (safeLevel - 1) * (safeLevel - 1);
}

export function levelForXp(xp: number) {
  const safeXp = Math.max(0, Math.floor(xp));
  return Math.floor(Math.sqrt(safeXp / 100)) + 1;
}

export interface PublicProgress {
  level: number;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  achievementCount: number;
}

export function getProgressSummary(
  progress: { xp: number; level?: number } | null | undefined,
  achievementCount = 0,
): PublicProgress {
  const xp = Math.max(0, progress?.xp ?? 0);
  // XP is the authority; the stored level only saves a recalculation on writes.
  const level = levelForXp(xp);
  const currentLevelXp = xpRequiredForLevel(level);
  const nextLevelXp = xpRequiredForLevel(level + 1);
  const levelSpan = nextLevelXp - currentLevelXp;
  return {
    level,
    xp,
    currentLevelXp,
    nextLevelXp,
    progressPercent: levelSpan > 0 ? Math.min(100, Math.max(0, ((xp - currentLevelXp) / levelSpan) * 100)) : 100,
    achievementCount,
  };
}
