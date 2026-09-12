import { z } from "zod";
import {
  SOCIAL_PLATFORMS,
  isSafeSocialUrl,
  type SocialLink,
  type SocialPlatform,
} from "@/modules/profiles/types";

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const HTML_TAG = /<\/?[a-z][^>]*>/i;

function safePlainText(value: string, maximum: number) {
  const trimmed = value.trim();
  if (trimmed.length > maximum) return false;
  if (CONTROL_CHARACTERS.test(trimmed) || HTML_TAG.test(trimmed)) return false;
  return true;
}

export const displayNameSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => safePlainText(value, 60), "El nombre visible no es válido")
  .transform((value) => value || null);

export const bioSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => safePlainText(value, 240), "La bio debe ser texto plano de hasta 240 caracteres")
  .transform((value) => value || null);

export const minecraftUsernameSchema = z
  .string()
  .transform((value) => value.trim())
  .refine(
    (value) => !value || /^[A-Za-z0-9_]{3,16}$/.test(value),
    "Username de Minecraft inválido (3-16 caracteres, sin espacios)",
  )
  .transform((value) => value || null);

const socialLinkSchema = z
  .object({
    platform: z.enum(SOCIAL_PLATFORMS),
    url: z.string().trim().min(1).max(2_048),
  })
  .superRefine((link, context) => {
    if (!isSafeSocialUrl(link.platform, link.url)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "El enlace social no es válido" });
    }
  });

export const socialLinksSchema = z
  .array(socialLinkSchema)
  .max(SOCIAL_PLATFORMS.length, "Demasiados enlaces sociales")
  .superRefine((links, context) => {
    const seen = new Set<SocialPlatform>();
    for (const [index, link] of links.entries()) {
      if (seen.has(link.platform)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "No repitas una plataforma", path: [index, "platform"] });
      }
      seen.add(link.platform);
    }
  })
  .transform((links): SocialLink[] => links.map((link) => ({ ...link, url: link.url.trim() })));

export const profileUpdateSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    username: z.string().optional(),
    bio: bioSchema.optional(),
    minecraftUsername: minecraftUsernameSchema.optional(),
    socialLinks: socialLinksSchema.optional(),
  })
  .strict();

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
