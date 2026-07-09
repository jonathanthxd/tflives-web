import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PostsListPage() {
  const posts = await prisma.post.findMany({
    include: { modality: true, author: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const typeLabels: Record<string, string> = {
    UPDATE: "Update",
    PATCH: "Parche",
    NEWS: "Noticia",
    EVENT: "Evento",
  };

  const typeColors: Record<string, string> = {
    UPDATE: "text-emerald-400 bg-emerald-500/10",
    PATCH: "text-amber-400 bg-amber-500/10",
    NEWS: "text-tfl-sky bg-tfl-sky/10",
    EVENT: "text-purple-400 bg-purple-500/10",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-tfl-bone">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="px-5 py-2.5 bg-tfl-sky/10 border border-tfl-sky/30 rounded-xl text-tfl-sky font-medium hover:bg-tfl-sky/20 transition-all duration-300"
        >
          + Nuevo Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-tfl-slate/20 rounded-2xl border border-tfl-sky/10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tfl-sky/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-tfl-sky/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <p className="text-tfl-stone">No hay posts aún. Crea el primero.</p>
        </div>
      ) : (
        <div className="bg-tfl-slate/20 rounded-2xl border border-tfl-sky/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-tfl-sky/10">
                <th className="text-left px-6 py-4 text-xs font-medium text-tfl-stone uppercase tracking-wider">Título</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-tfl-stone uppercase tracking-wider">Modalidad</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-tfl-stone uppercase tracking-wider">Tipo</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-tfl-stone uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-tfl-stone uppercase tracking-wider">Fecha</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-tfl-stone uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-tfl-sky/5 hover:bg-tfl-sky/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-tfl-bone">{post.title}</div>
                    <div className="text-xs text-tfl-stone/50">{post.author.name || post.author.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-tfl-stone">{post.modality.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${typeColors[post.type]}`}>
                      {typeLabels[post.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${post.published ? "text-green-400 bg-green-500/10" : "text-amber-400 bg-amber-500/10"}`}>
                      {post.published ? "Publicado" : "Borrador"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-tfl-stone">
                    {new Date(post.createdAt).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-sm text-tfl-sky hover:text-tfl-pastel transition-colors"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}