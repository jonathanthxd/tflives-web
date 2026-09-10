import { z } from "zod";
import { slug, mediaUrl, translations } from "./content-validation";

const postSlug = slug.refine(
  (value) => !["wiki", "estado", "modalidades"].includes(value),
  "Reserved URL",
);

export const postSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  slug: postSlug,
  content: z.string().trim().max(100000).min(1, "El contenido es obligatorio"),
  excerpt: z.string().max(500).optional(),
  type: z.enum([
    "NEWS",
    "UPDATE",
    "CHANGELOG",
    "EVENT",
    "MAINTENANCE",
    "PATCH",
  ]),
  modalityId: z.string().nullable().optional(),
  image: mediaUrl,
  locale: z.enum(["es", "en"]).default("es"),
  translations,
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  archived: z.boolean().default(false),
  scheduledFor: z.string().datetime().nullable().optional(),
  published: z.boolean().default(false),
});

export type PostFormData = z.infer<typeof postSchema>;

export const postUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  slug: postSlug.optional(),
  content: z.string().trim().max(100000).min(1).optional(),
  excerpt: z.string().max(500).nullable().optional(),
  type: z
    .enum(["NEWS", "UPDATE", "CHANGELOG", "EVENT", "MAINTENANCE", "PATCH"])
    .optional(),
  modalityId: z.string().nullable().optional(),
  image: mediaUrl,
  locale: z.enum(["es", "en"]).optional(),
  translations,
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  published: z.boolean().optional(),
  archived: z.boolean().optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
});

export type PostUpdateData = z.infer<typeof postUpdateSchema>;

export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
