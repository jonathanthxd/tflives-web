"use client";

import { motion } from "framer-motion";
import Link from "next/link";
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
  UPDATE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PATCH: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  NEWS: "bg-tfl-sky/10 text-tfl-sky border-tfl-sky/20",
  EVENT: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const typeLabels: Record<PostType, string> = {
  UPDATE: "Update",
  PATCH: "Parche",
  NEWS: "Noticia",
  EVENT: "Evento",
};

export default function PostCard({ title, excerpt, type, modality, date, slug, image }: PostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/network/${slug}`}>
        <div className="group relative bg-tfl-night/60 backdrop-blur-md border border-tfl-sky/10 rounded-2xl overflow-hidden transition-all duration-500 hover:border-tfl-sky/30 hover:shadow-[0_0_40px_rgba(96,165,250,0.08)] hover:-translate-y-1">
          {/* Image placeholder or actual image */}
          <div className="relative h-48 bg-tfl-slate/30 overflow-hidden">
            {image ? (
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-tfl-slate/50 to-tfl-night/50">
                <span className="font-display text-4xl font-bold text-tfl-sky/20">{modality[0]}</span>
              </div>
            )}
            {/* Type badge */}
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 text-xs font-medium tracking-wider uppercase rounded-full border ${typeColors[type]}`}>
                {typeLabels[type]}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-tfl-stone/70 font-medium">{modality}</span>
              <span className="text-tfl-stone/30">•</span>
              <span className="text-xs text-tfl-stone/50">{date}</span>
            </div>

            <h3 className="font-display text-lg font-semibold text-tfl-bone mb-2 group-hover:text-tfl-sky transition-colors duration-300 line-clamp-2">
              {title}
            </h3>

            <p className="text-sm text-tfl-stone/70 line-clamp-2 leading-relaxed">
              {excerpt}
            </p>

            <div className="mt-4 flex items-center gap-2 text-tfl-sky/70 text-sm font-medium group-hover:text-tfl-sky transition-colors duration-300">
              <span>Leer más</span>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}