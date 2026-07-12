import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

export const dynamic = "force-dynamic";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { slug } = await params; // ✅ esperamos la promesa

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
    UPDATE: "Update",
    PATCH: "Parche",
    NEWS: "Noticia",
    EVENT: "Evento",
  };

  const typeColors: Record<string, string> = {
    UPDATE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    PATCH: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    NEWS: "text-tfl-sky bg-tfl-sky/10 border-tfl-sky/20",
    EVENT: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <main className="relative min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/network"
          className="inline-flex items-center gap-2 text-sm text-tfl-stone hover:text-tfl-sky transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a TFL Network
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 text-xs font-medium tracking-wider uppercase rounded-full border ${typeColors[post.type]}`}>
              {typeLabels[post.type]}
            </span>
            <span className="text-sm text-tfl-stone">{post.modality.name}</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-tfl-bone mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-tfl-stone">
            <div className="flex items-center gap-2">
              {post.author.image ? (
                <img src={post.author.image} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-tfl-sky/20 flex items-center justify-center text-xs font-bold text-tfl-sky">
                  {(post.author.name?.[0] || "U").toUpperCase()}
                </div>
              )}
              <span>{post.author.name || "Autor desconocido"}</span>
            </div>
            <span>•</span>
            <span>
              {new Date(post.createdAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {post.image && (
          <div className="mb-8 rounded-2xl overflow-hidden bg-tfl-slate/30 border border-tfl-sky/10">
            <img src={post.image} alt={post.title} className="w-full h-auto object-cover max-h-[400px]" />
          </div>
        )}

        <div className="prose prose-invert prose-tfl max-w-none">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </div>
    </main>
  );
}