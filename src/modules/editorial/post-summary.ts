import type { Modality, Post } from "@prisma/client";
import { translated } from "./publication";
export function postSummary(raw: Post & { modality: Modality | null }, locale: string) {
  const post = translated(raw, locale);
  return { id: post.id, title: post.title, excerpt: post.excerpt ?? "", type: post.type, modality: post.modality ? translated(post.modality, locale).name : "TFLives", date: (post.publishedAt ?? post.createdAt).toLocaleDateString(locale), slug: post.slug, image: post.image };
}
