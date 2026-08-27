import { prisma } from "@/infrastructure/database/prisma";
import { Link } from "@/i18n/navigation";
import { Plus, Pencil, Newspaper } from "lucide-react";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { StatusBadge } from "@/modules/administration/components/ui/status-badge";
import { EmptyState } from "@/modules/administration/components/ui/empty-state";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  UPDATE: "Update",
  PATCH: "Parche",
  NEWS: "Noticia",
  EVENT: "Evento",
};

const TYPE_COLORS: Record<string, string> = {
  UPDATE: "text-emerald-700 dark:text-emerald-400 bg-emerald-600/10 dark:bg-emerald-500/10",
  PATCH: "text-amber-700 dark:text-amber-400 bg-amber-600/10 dark:bg-amber-500/10",
  NEWS: "text-primary bg-primary/10",
  EVENT: "text-purple-600 dark:text-purple-400 bg-purple-600/10 dark:bg-purple-500/10",
};

export default async function PostsListPage() {
  const posts = await prisma.post.findMany({
    include: { modality: true, author: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        icon={SECTION_ICONS.posts}
        title="Posts"
        description="Noticias, actualizaciones, parches y eventos de TFL Network."
        actions={
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary/20"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nuevo post
          </Link>
        }
      />

      {posts.length === 0 ? (
        <EmptyState icon={Newspaper} title="No hay posts aún" description="Creá el primero para que aparezca en TFL Network." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card/20">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Título</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Modalidad</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha</th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-primary/5 transition-colors hover:bg-primary/5">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{post.title}</div>
                    <div className="text-xs text-muted-foreground/50">{post.author.name || post.author.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{post.modality.name}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_COLORS[post.type]}`}>
                      {TYPE_LABELS[post.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {post.archived ? (
                      <StatusBadge tone="neutral">Archivado</StatusBadge>
                    ) : post.published ? (
                      <StatusBadge tone="success">Publicado</StatusBadge>
                    ) : (
                      <StatusBadge tone="warning">Borrador</StatusBadge>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="inline-flex rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
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
