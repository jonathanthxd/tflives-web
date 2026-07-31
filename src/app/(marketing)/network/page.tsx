import { prisma } from "@/infrastructure/database/prisma";
import PostCard from "@/modules/editorial/components/post-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface NetworkPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NetworkPage({ searchParams }: NetworkPageProps) {
  const params = await searchParams;
  const modalityFilter = typeof params.modality === "string" ? params.modality : "all";

  const modalities = await prisma.modality.findMany({
    orderBy: { name: "asc" },
  });

  const posts = await prisma.post.findMany({
    where: modalityFilter !== "all" ? { modalityId: modalityFilter } : undefined,
    include: { modality: true, author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <main className="relative min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            TFL <span className="text-primary">Network</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Actualizaciones, parches y noticias de todos nuestros servidores.
          </p>
        </div>

        {/* Filters — Server-side with Link */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Link
            href="/network"
            className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-300 ${
              modalityFilter === "all"
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-transparent text-muted-foreground border-muted-foreground/20 hover:border-primary/30 hover:text-primary"
            }`}
          >
            Todas
          </Link>
          {modalities.map((mod) => (
            <Link
              key={mod.id}
              href={`/network?modality=${mod.id}`}
              className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-300 ${
                modalityFilter === mod.id
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-transparent text-muted-foreground border-muted-foreground/20 hover:border-primary/30 hover:text-primary"
              }`}
            >
              {mod.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                title={post.title}
                excerpt={post.excerpt || ""}
                type={post.type}
                modality={post.modality.name}
                date={new Date(post.createdAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                slug={post.slug}
                image={post.image}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/5 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="font-display text-xl text-foreground mb-2">No hay posts aún</h3>
            <p className="text-muted-foreground">Los updates aparecerán aquí próximamente.</p>
          </div>
        )}
      </div>
    </main>
  );
}