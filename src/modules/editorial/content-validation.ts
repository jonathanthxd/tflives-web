import { z } from "zod";

export const slug = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const mediaUrl = z
  .string()
  .max(2048)
  .refine(
    (value) => !value || (/^https:\/\//i.test(value) && URL.canParse(value)),
    "HTTPS URL required",
  )
  .nullable()
  .optional();
const short = z.string().trim().max(500);
const long = z.string().trim().max(100000);
export const translations = z.preprocess(
  (value) => (value === null ? undefined : value),
  z
    .object({ es: z.record(long).optional(), en: z.record(long).optional() })
    .optional(),
);
const order = z.number().int().min(-100000).max(100000).default(0);
export const modalitySchema = z.object({
  name: short.min(1),
  slug,
  description: short.nullable().optional(),
  content: long.nullable().optional(),
  status: z
    .enum(["ONLINE", "MAINTENANCE", "COMING_SOON", "OFFLINE", "ARCHIVED"])
    .default("COMING_SOON"),
  order,
  published: z.boolean().default(false),
  minecraftVersion: short.nullable().optional(),
  icon: z.string().max(80).nullable().optional(),
  banner: mediaUrl,
  translations,
});
export const teamSchema = z.object({
  name: short.min(1),
  roleTitle: short.min(1),
  bio: long.nullable().optional(),
  avatarUrl: mediaUrl,
  socialLinks: z
    .array(
      z
        .string()
        .url()
        .max(2048)
        .refine((v) => v.startsWith("https://")),
    )
    .max(10)
    .default([]),
  order,
  active: z.boolean().default(false),
  translations,
});
export const timelineSchema = z.object({
  title: short.min(1),
  dateLabel: short.min(1),
  description: long.min(1),
  category: short.nullable().optional(),
  image: mediaUrl,
  order,
  published: z.boolean().default(false),
  archived: z.boolean().default(false),
  translations,
});
export const categorySchema = z.object({
  name: short.min(1),
  slug,
  order,
  translations,
});
export const wikiSchema = z
  .object({
    title: short.min(1),
    slug,
    excerpt: short.nullable().optional(),
    content: long.min(1),
    locale: z.enum(["es", "en"]).default("es"),
    translations,
    state: z
      .enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"])
      .default("DRAFT"),
    tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
    categoryId: z.string().nullable().optional(),
    modalityId: z.string().nullable().optional(),
    scheduledFor: z.string().datetime().nullable().optional(),
  })
  .refine((v) => v.state !== "SCHEDULED" || !!v.scheduledFor, {
    path: ["scheduledFor"],
    message: "Schedule required",
  });
