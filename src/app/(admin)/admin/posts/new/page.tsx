"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      content: formData.get("content") as string,
      excerpt: formData.get("excerpt") as string || undefined,
      type: formData.get("type") as string,
      modalityId: formData.get("modalityId") as string,
      image: formData.get("image") as string || undefined,
      published: formData.get("published") === "on",
    };

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Nuevo Post</h1>

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
            className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            placeholder="Título del post"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Slug (URL)</label>
          <input
            name="slug"
            type="text"
            required
            pattern="[a-z0-9-]+"
            className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            placeholder="nueva-actualizacion-v1-5"
          />
          <p className="text-xs text-muted-foreground/50 mt-1">Solo minúsculas, números y guiones</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Modalidad</label>
            <select
              name="modalityId"
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
              name="type"
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
            name="excerpt"
            type="text"
            className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            placeholder="Breve descripción del post..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Contenido (Markdown)</label>
          <textarea
            name="content"
            required
            rows={12}
            className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-y font-mono text-sm"
            placeholder="# Título&#10;&#10;Contenido en markdown..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Imagen URL (opcional)</label>
          <input
            name="image"
            type="url"
            className="w-full px-4 py-3 bg-card/30 border border-primary/20 rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            placeholder="https://..."
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            name="published"
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
            className="px-8 py-3 bg-primary/10 border border-primary/30 rounded-xl text-primary font-medium hover:bg-primary/20 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear Post"}
          </button>
          <a
            href="/admin/posts"
            className="px-8 py-3 border border-muted-foreground/20 rounded-xl text-muted-foreground font-medium hover:border-primary/30 hover:text-primary transition-all duration-300"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}