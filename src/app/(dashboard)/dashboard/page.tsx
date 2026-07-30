"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface UserProfile {
  id: string;
  name: string | null;
  displayName: string | null;
  username: string | null;
  email: string;
  role: string;
  image: string | null;
  bio: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bioDraft, setBioDraft] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/me");
      const data = await res.json();

      if (!data.user) {
        router.push("/login?redirect=/dashboard");
        return;
      }

      // Los signups por OAuth llegan sin username: sin él no hay perfil público.
      if (!data.user.username) {
        router.replace("/onboarding/username");
        return;
      }

      setUser(data.user);
      setBioDraft(data.user.bio || "");
      setLoading(false);
    }

    load();
  }, [router]);

  const handleSaveBio = async () => {
    setSavingBio(true);
    setBioSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioDraft }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser((prev) => (prev ? { ...prev, bio: data.user.bio } : null));
      setBioSaved(true);
    } catch {
      setUploadError("No se pudo guardar la bio");
    } finally {
      setSavingBio(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("La imagen no puede superar los 2MB");
      return;
    }

    setUploadError("");
    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const updateRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: `${publicUrl}?t=${Date.now()}` }),
      });

      if (!updateRes.ok) throw new Error("No se pudo actualizar el perfil");
      const updateData = await updateRes.json();

      setUser((prev) => (prev ? { ...prev, image: updateData.user.image } : null));
    } catch {
      setUploadError("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.displayName || user.name || user.username || "Usuario";
  const initial = (displayName[0] || "U").toUpperCase();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">
        Bienvenido, {displayName}
      </h1>
      <p className="text-muted-foreground mb-8">Panel de control de tu cuenta TFLives</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={displayName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                  <span className="font-display text-xl font-bold text-primary">{initial}</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{displayName}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.username && (
                <Link href={`/perfil/${user.username}`} className="text-xs text-primary hover:underline">
                  @{user.username}
                </Link>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-2 text-sm text-primary border border-primary/20 rounded-xl hover:bg-primary/10 transition-all disabled:opacity-50"
          >
            {uploading ? "Subiendo..." : "Cambiar foto de perfil"}
          </button>
          {uploadError && <p className="mt-2 text-xs text-destructive">{uploadError}</p>}

          <div className="flex items-center gap-2 mt-4">
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              {user.role}
            </span>
          </div>
        </div>

        {/* Editar bio */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Sobre mí</h3>
          <textarea
            value={bioDraft}
            onChange={(e) => {
              setBioDraft(e.target.value);
              setBioSaved(false);
            }}
            maxLength={280}
            rows={3}
            placeholder="Contá algo sobre vos..."
            className="w-full rounded-xl border border-input bg-input/30 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">{bioDraft.length}/280</span>
            <Button type="button" size="sm" onClick={handleSaveBio} disabled={savingBio}>
              {savingBio ? "Guardando..." : bioSaved ? "Guardado ✓" : "Guardar"}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Acciones Rápidas</h3>
          <div className="space-y-2">
            {user.username && (
              <Link
                href={`/perfil/${user.username}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground transition-all"
              >
                Ver mi perfil público
              </Link>
            )}
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground transition-all"
              >
                Panel Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-destructive hover:bg-destructive/5 transition-all w-full text-left"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
