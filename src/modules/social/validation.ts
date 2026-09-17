import { z } from "zod";
export const usernameInput = z.string().trim().min(1).max(32).transform((value) => value.toLowerCase());
export const targetInput = z.object({ username: usernameInput }).strict();
export const friendResponseInput = z.object({ friendshipId: z.string().min(1).max(100), action: z.enum(["accept", "decline"]) }).strict();
export const friendDeleteInput = z.union([targetInput, z.object({ friendshipId: z.string().min(1).max(100) }).strict()]);
export const privacyInput = z.object({ allowFriendRequests: z.boolean().optional(), friendsListVisibility: z.enum(["PUBLIC", "FRIENDS_ONLY", "PRIVATE"]).optional() }).strict().refine((value) => Object.keys(value).length > 0);
