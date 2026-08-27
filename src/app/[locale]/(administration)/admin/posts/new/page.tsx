"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Eye } from "lucide-react";
import { useRouter, Link } from "@/i18n/navigation";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";
import { slugify } from "@/modules/editorial/validation";
import MarkdownPreview from "@/modules/editorial/components/markdown-preview";

interface Modality {
  id: string;
  name: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [modalitiesLoading, setModalitiesLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [modalityId, setModalityId] = useState("");
  const [type, setType] = useState("UPDATE");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [published, setPublished] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    fetch("/api/modalities")
      .then((res) => res.json())
      .then((data) => {
        setModalities(data.modalities || []);
        setModalitiesLoading(false);
      })
      .catch(() => {
        setError("Error al cargar modalidades");
        setModalitiesLoading(false);
      });
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          content,
          excerpt: excerpt || undefined,
          type,
          modalityId,
          image: image || undefined,
          published,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Error al crear el post");
        return;
      }

      router.push("/admin/posts");
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader icon={SECTION_ICONS.posts} title="Nuevo post" />

      {error && (
        <div className="mb-6 p-4 bg-red-600/10 dark:bg-red-500/10 border border-red-600/20 dark:border-red-500/20 rounded-xl text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Título</label>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            type="text"
            required
            className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            placeholder="Título del post"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Slug (URL)</label>
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            type="text"
            required
            pattern="[a-z0-9-]+"
            className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            placeholder="nueva-actualizacion-v1-5"
          />
          <p className="text-xs text-muted-foreground/50 mt-1">
            Se genera solo desde el título — editalo si querés otra cosa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Modalidad</label>
            <select
              value={modalityId}
              onChange={(e) => setModalityId(e.target.value)}
              required
              disabled={modalitiesLoading}
              className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50"
            >
              <option value="">{modalitiesLoading ? "Cargando..." : "Seleccionar..."}</option>
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
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
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
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            type="text"
            className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            placeholder="Breve descripción del post..."
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
              className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-y font-mono text-sm"
              placeholder={"# Título\n\nContenido en markdown..."}
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
            value={image}
            onChange={(e) => setImage(e.target.value)}
            type="url"
            className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            placeholder="https://..."
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            type="checkbox"
            id="published"
            className="w-5 h-5 rounded border-primary/30 bg-card/30 text-primary focus:ring-primary/30"
          />
          <label htmlFor="published" className="text-sm text-muted-foreground">Publicar inmediatamente</label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || modalitiesLoading}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary/10 border border-primary/30 rounded-xl text-primary font-medium hover:bg-primary/20 transition-all duration-300 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            {loading ? "Creando..." : "Crear post"}
          </button>
          <Link
            href="/admin/posts"
            className="px-8 py-3 border border-muted-foreground/20 rounded-xl text-muted-foreground font-medium hover:border-primary/30 hover:text-primary transition-all duration-300"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
