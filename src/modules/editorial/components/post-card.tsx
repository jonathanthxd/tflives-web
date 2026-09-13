"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PostType } from "@prisma/client";

interface PostCardProps {
  title: string;
  excerpt: string;
  type: PostType;
  modality: string;
  date: string;
  slug: string;
  image?: string | null;
}

const typeColors: Record<PostType, string> = {
  CHANGELOG:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  MAINTENANCE:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  UPDATE:
    "bg-emerald-600/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/30 dark:border-emerald-500/20",
  PATCH:
    "bg-amber-600/10 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-600/30 dark:border-amber-500/20",
  NEWS: "bg-primary/10 text-primary border-primary/20",
  EVENT:
    "bg-purple-600/10 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-600/30 dark:border-purple-500/20",
};

export default function PostCard({
  title,
  excerpt,
  type,
  modality,
  date,
  slug,
  image,
}: PostCardProps) {
  const t = useTranslations("PostCard");
  const typeLabels: Record<PostType, string> = {
    CHANGELOG: t("changelog"),
    MAINTENANCE: t("maintenance"),
    UPDATE: t("update"),
    PATCH: t("parche"),
    NEWS: t("noticia"),
    EVENT: t("evento"),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/network/${slug}`}>
        <div className="tfl-glass tfl-glass-soft group relative border border-primary/10 rounded-2xl overflow-hidden transition-all duration-500 hover:border-primary/30 hover:shadow-[0_18px_52px_-34px_hsl(var(--primary)/0.42)] hover:-translate-y-1">
          {/* Image placeholder or actual image */}
          <div className="relative h-48 bg-muted/30 overflow-hidden">
            {image ? (
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card/50 to-background/50">
                <span className="font-display text-4xl font-bold text-primary/20">
                  {modality[0]}
                </span>
              </div>
            )}
            {/* Type badge */}
            <div className="absolute top-4 left-4">
              <span
                className={`px-3 py-1 text-xs font-medium tracking-wider uppercase rounded-full border ${typeColors[type]}`}
              >
                {typeLabels[type]}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground/70 font-medium">
                {modality}
              </span>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-xs text-muted-foreground/50">{date}</span>
            </div>

            <h3 className="font-display text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2">
              {title}
            </h3>

            <p className="text-sm text-muted-foreground/70 line-clamp-2 leading-relaxed">
              {excerpt}
            </p>

            <div className="mt-4 flex items-center gap-2 text-primary/70 text-sm font-medium group-hover:text-primary transition-colors duration-300">
              <span>{t("leerMas")}</span>
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
