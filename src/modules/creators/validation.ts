import { z } from "zod";

export const CREATOR_CATEGORIES = [
  "MINECRAFT",
  "FORTNITE",
  "ROBLOX",
  "VARIETY",
  "JUST_CHATTING",
  "OTHER",
] as const;

export const CREATOR_PLATFORM_TYPES = [
  "TWITCH",
  "YOUTUBE",
  "KICK",
  "TIKTOK",
  "FACEBOOK_GAMING",
  "EXTERNAL",
] as const;

export type CreatorCategoryValue = (typeof CREATOR_CATEGORIES)[number];
export type CreatorPlatformValue = (typeof CREATOR_PLATFORM_TYPES)[number];

const PLATFORM_HOSTS: Record<Exclude<CreatorPlatformValue, "EXTERNAL">, readonly string[]> = {
  TWITCH: ["twitch.tv", "www.twitch.tv"],
  YOUTUBE: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"],
  KICK: ["kick.com", "www.kick.com"],
  TIKTOK: ["tiktok.com", "www.tiktok.com"],
  FACEBOOK_GAMING: ["facebook.com", "www.facebook.com", "gaming.facebook.com", "fb.gg"],
};

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const HTML_TAG = /<\/?[a-z][^>]*>/i;

export function isSafeCreatorUrl(platform: CreatorPlatformValue, value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 2_048) return false;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (platform === "EXTERNAL") return true;
    return PLATFORM_HOSTS[platform].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function plainText(maximum: number) {
  return z.string().trim().min(1).max(maximum).refine(
    (value) => !CONTROL_CHARACTERS.test(value) && !HTML_TAG.test(value),
    "Use plain text only",
  );
}

const optionalPlainText = (maximum: number) => z.string().trim().max(maximum).refine(
  (value) => !CONTROL_CHARACTERS.test(value) && !HTML_TAG.test(value),
  "Use plain text only",
).transform((value) => value || null);

const creatorPlatformSchema = z.object({
  type: z.enum(CREATOR_PLATFORM_TYPES),
  url: z.string().trim().min(1).max(2_048),
}).superRefine((platform, context) => {
  if (!isSafeCreatorUrl(platform.type, platform.url)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid creator link" });
  }
});

export const creatorApplicationSchema = z.object({
  primaryPlatform: z.enum(CREATOR_PLATFORM_TYPES),
  channelUrl: z.string().trim().min(1).max(2_048),
  category: z.enum(CREATOR_CATEGORIES),
  description: plainText(280),
  motivation: plainText(500),
  activityFrequency: optionalPlainText(120).optional(),
}).strict().superRefine((application, context) => {
  if (!isSafeCreatorUrl(application.primaryPlatform, application.channelUrl)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid creator link", path: ["channelUrl"] });
  }
});

export const creatorProfileUpdateSchema = z.object({
  headline: optionalPlainText(100).optional(),
  description: plainText(500).optional(),
  platforms: z.array(creatorPlatformSchema).min(1).max(CREATOR_PLATFORM_TYPES.length).superRefine((platforms, context) => {
    const seen = new Set<CreatorPlatformValue>();
    platforms.forEach((platform, index) => {
      if (seen.has(platform.type)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate creator platform", path: [index, "type"] });
      }
      seen.add(platform.type);
    });
  }).optional(),
}).strict();

export const creatorReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  adminNote: optionalPlainText(500).optional(),
  rejectionMessage: optionalPlainText(240).optional(),
}).strict().superRefine((value, context) => {
  if (value.action === "reject" && !value.rejectionMessage) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A short visible rejection message is required", path: ["rejectionMessage"] });
  }
});

export const adminCreatorUpdateSchema = z.object({
  action: z.enum(["pause", "reactivate", "update"]),
  category: z.enum(CREATOR_CATEGORIES).optional(),
  headline: optionalPlainText(100).optional(),
  description: plainText(500).optional(),
  featured: z.boolean().optional(),
  featuredOrder: z.number().int().min(0).max(999).nullable().optional(),
}).strict();

export type CreatorApplicationInput = z.infer<typeof creatorApplicationSchema>;
export type CreatorProfileUpdateInput = z.infer<typeof creatorProfileUpdateSchema>;
export type CreatorReviewInput = z.infer<typeof creatorReviewSchema>;
export type AdminCreatorUpdateInput = z.infer<typeof adminCreatorUpdateSchema>;
