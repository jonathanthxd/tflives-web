"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Archive, ArchiveRestore, Trash2, TriangleAlert, Pencil, Eye } from "lucide-react";
import { useRouter, Link } from "@/i18n/navigation";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";
import MarkdownPreview from "@/modules/editorial/components/markdown-preview";

interface Modality {
  id: string;
  name: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  type: "UPDATE" | "PATCH" | "NEWS" | "EVENT";
  modalityId: string;
  image: string | null;
  published: boolean;
  archived: boolean;
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [content, setContent] = useState("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    Promise.all([
      fetch("/api/modalities").then((res) => res.json()),
      fetch(`/api/posts/${id}`).then((res) => res.json()),
    ])
      .then(([modalitiesData, postData]) => {
        setModalities(modalitiesData.modalities || []);
        if (postData.post) {
          setPost(postData.post);
          setContent(postData.post.content);
        } else {
          setError(postData.error || "Post no encontrado");
        }
      })
      .catch(() => setError("Error al cargar el post"))
      .finally(() => setFetching(false));
  }, [id]);

  async function patch(data: Record<string, unknown>) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Error al guardar");
        return null;
      }
      setPost(result.post);
      return result.post as Post;
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await patch({
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      content,
      excerpt: (formData.get("excerpt") as string) || null,
      type: formData.get("type") as string,
      modalityId: formData.get("modalityId") as string,
      image: (formData.get("image") as string) || null,
      published: formData.get("published") === "on",
    });
  }

  async function toggleArchived() {
    if (!post) return;
    await patch({ archived: !post.archived });
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Error al eliminar");
        setDeleting(false);
        return;
      }
      router.push("/admin/posts");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <p className="text-muted-foreground">Cargando...</p>;
  if (!post) {
    return (
      <div>
        <p className="text-destructive mb-4">{error || "Post no encontrado"}</p>
        <Link href="/admin/posts" className="text-primary text-sm">
          Volver a Posts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        icon={SECTION_ICONS.posts}
        title="Editar post"
        actions={
          <>
            <button
              onClick={toggleArchived}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-muted-foreground/20 px-4 py-2 text-sm text-muted-foreground transition-all hover:border-primary/30 hover:text-primary disabled:opacity-50"
            >
              {post.archived ? <ArchiveRestore className="h-4 w-4" strokeWidth={1.75} /> : <Archive className="h-4 w-4" strokeWidth={1.75} />}
              {post.archived ? "Desarchivar" : "Archivar"}
            </button>
            <button
              onClick={() => setDeleting(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2 text-sm text-destructive transition-all hover:bg-destructive/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              Eliminar
            </button>
          </>
        }
      />

      {post.archived && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-600/20 bg-amber-600/10 p-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
          <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Este post está archivado.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-600/10 dark:bg-red-500/10 border border-red-600/20 dark:border-red-500/20 rounded-xl text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Título</label>
          <input
            name="title"
            type="text"
            required
            defaultValue={post.title}
            className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Slug (URL)</label>
          <input
            name="slug"
            type="text"
            required
            pattern="[a-z0-9-]+"
            defaultValue={post.slug}
            className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Modalidad</label>
            <select
              name="modalityId"
              required
              defaultValue={post.modalityId}
              className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            >
              {modalities.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Tipo</label>
            <select
              name="type"
              required
              defaultValue={post.type}
              className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            >
              <option value="UPDATE">Update</option>
              <option value="PATCH">Parche</option>
              <option value="NEWS">Noticia</option>
              <option value="EVENT">Evento</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Extracto</label>
          <input
            name="excerpt"
            type="text"
            defaultValue={post.excerpt ?? ""}
            className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-muted-foreground">Contenido (Markdown)</label>
            <div className="inline-flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setTab("edit")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  tab === "edit" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Pencil className="h-3 w-3" strokeWidth={2} />
                Editar
              </button>
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  tab === "preview" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-3 w-3" strokeWidth={2} />
                Vista previa
              </button>
            </div>
          </div>

          {tab === "edit" ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={14}
              className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-y font-mono text-sm"
            />
          ) : (
            <div className="rounded-xl border border-primary/20 bg-card/30 px-6 py-5 min-h-[21rem]">
              <MarkdownPreview content={content} />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Imagen URL (opcional)</label>
          <input
            name="image"
            type="url"
            defaultValue={post.image ?? ""}
            className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            name="published"
            type="checkbox"
            id="published"
            defaultChecked={post.published}
            className="w-5 h-5 rounded border-primary/30 bg-card/30 text-primary focus:ring-primary/30"
          />
          <label htmlFor="published" className="text-sm text-muted-foreground">Publicado</label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-primary/10 border border-primary/30 rounded-xl text-primary font-medium hover:bg-primary/20 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link
            href="/admin/posts"
            className="px-8 py-3 border border-muted-foreground/20 rounded-xl text-muted-foreground font-medium hover:border-primary/30 hover:text-primary transition-all duration-300"
          >
            Volver
          </Link>
        </div>
      </form>

      <ConfirmDialog
        open={deleting}
        title="Eliminar post"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        busy={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(false)}
      />
    </div>
  );
}
