import { z } from "zod";

export const postSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(200),
  slug: z.string().min(1, "El slug es obligatorio").max(200).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  content: z.string().min(1, "El contenido es obligatorio"),
  excerpt: z.string().max(500).optional(),
  type: z.enum(["UPDATE", "PATCH", "NEWS", "EVENT"]),
  modalityId: z.string().min(1, "Selecciona una modalidad"),
  image: z.string().optional(),
  published: z.boolean().default(false),
});

export type PostFormData = z.infer<typeof postSchema>;