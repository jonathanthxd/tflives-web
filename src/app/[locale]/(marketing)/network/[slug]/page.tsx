import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/infrastructure/database/prisma";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LikeButton from "@/modules/community/components/like-button";
import CommentsSection from "@/modules/community/components/comments-section";

export const dynamic = "force-dynamic";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { slug } = await params; // ✅ esperamos la promesa
  const t = await getTranslations("Network");
  const tPost = await getTranslations("PostCard");
  const locale = await getLocale();

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      modality: true,
      author: { select: { name: true, image: true } },
    },
  });

  if (!post || !post.published) {
    notFound();
  }

  const typeLabels: Record<string, string> = {
    UPDATE: tPost("update"),
    PATCH: tPost("parche"),
    NEWS: tPost("noticia"),
    EVENT: tPost("evento"),
  };

  const typeColors: Record<string, string> = {
    UPDATE:
      "text-emerald-700 dark:text-emerald-400 bg-emerald-600/10 dark:bg-emerald-500/10 border-emerald-600/30 dark:border-emerald-500/20",
    PATCH:
      "text-amber-700 dark:text-amber-400 bg-amber-600/10 dark:bg-amber-500/10 border-amber-600/30 dark:border-amber-500/20",
    NEWS: "text-primary bg-primary/10 border-primary/20",
    EVENT:
      "text-purple-600 dark:text-purple-400 bg-purple-600/10 dark:bg-purple-500/10 border-purple-600/30 dark:border-purple-500/20",
  };

  return (
    <main className="relative min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/network"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t("volver")}
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 text-xs font-medium tracking-wider uppercase rounded-full border ${typeColors[post.type]}`}>
              {typeLabels[post.type]}
            </span>
            <span className="text-sm text-muted-foreground">{post.modality.name}</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {post.author.image ? (
                <img src={post.author.image} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {(post.author.name?.[0] || "U").toUpperCase()}
                </div>
              )}
              <span>{post.author.name || t("autorDesconocido")}</span>
            </div>
            <span>•</span>
            <span>
              {new Date(post.createdAt).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {post.image && (
          <div className="mb-8 rounded-2xl overflow-hidden bg-card/30 border border-primary/10">
            <img src={post.image} alt={post.title} className="w-full h-auto object-cover max-h-[400px]" />
          </div>
        )}

        <div className="prose prose-tfl max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        <div className="mt-10 flex items-center justify-between border-y border-primary/10 py-4">
          <LikeButton targetType="POST" targetId={post.id} size="lg" />
        </div>

        <CommentsSection postId={post.id} />
      </div>
    </main>
  );
}