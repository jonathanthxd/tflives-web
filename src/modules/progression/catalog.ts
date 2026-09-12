export const PROGRESSION_ACHIEVEMENTS = [
  { code: "PROFILE_COMPLETE", category: "IDENTITY", iconKey: "star", xpReward: 15 },
  { code: "EMAIL_VERIFIED", category: "IDENTITY", iconKey: "medal", xpReward: 15 },
  { code: "OAUTH_CONNECTED", category: "IDENTITY", iconKey: "zap", xpReward: 15 },
  { code: "FIRST_GLOBAL_MESSAGE", category: "COMMUNITY", iconKey: "rocket", xpReward: 10 },
  { code: "GLOBAL_REGULAR", category: "COMMUNITY", iconKey: "flame", xpReward: 15 },
  { code: "FIRST_DM", category: "SOCIAL", iconKey: "heart", xpReward: 10 },
  { code: "DM_REGULAR", category: "SOCIAL", iconKey: "medal", xpReward: 15 },
  { code: "FIRST_FRIEND", category: "SOCIAL", iconKey: "heart", xpReward: 15 },
  { code: "SOCIAL_FIVE", category: "SOCIAL", iconKey: "gem", xpReward: 25 },
  { code: "LEVEL_FIVE", category: "PROGRESS", iconKey: "trophy", xpReward: 20 },
  { code: "LEVEL_TEN", category: "PROGRESS", iconKey: "crown", xpReward: 30 },
] as const;

export type ProgressionAchievement = (typeof PROGRESSION_ACHIEVEMENTS)[number];
export type ProgressionAchievementCode = ProgressionAchievement["code"];
export type ProgressionAchievementCategory = ProgressionAchievement["category"];

export const PROGRESSION_ACHIEVEMENTS_BY_CODE = new Map<ProgressionAchievementCode, ProgressionAchievement>(
  PROGRESSION_ACHIEVEMENTS.map((achievement) => [achievement.code, achievement]),
);
