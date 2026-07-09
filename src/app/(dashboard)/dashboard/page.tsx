"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  role: string;
  image: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("tfl_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({
        id: payload.userId,
        name: payload.name || null,
        username: payload.username || null,
        email: payload.email,
        role: payload.role,
        image: payload.image || null,
      });
    } catch {
      localStorage.removeItem("tfl_token");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error);

      // Update user profile with new image
      const token = localStorage.getItem("tfl_token")!;
      const updateRes = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: uploadData.url }),
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.error);

      // Update token and state
      localStorage.setItem("tfl_token", updateData.token);
      setUser((prev) => prev ? { ...prev, image: uploadData.url } : null);
    } catch (error) {
      console.error(error);
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-tfl-sky/30 border-t-tfl-sky rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.name || user.username || "Usuario";
  const initial = (displayName[0] || "U").toUpperCase();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-tfl-bone mb-2">
        Bienvenido, {displayName}
      </h1>
      <p className="text-tfl-stone mb-8">Panel de control de tu cuenta TFLives</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-tfl-slate/20 backdrop-blur-sm border border-tfl-sky/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              {user.image ? (
                <img
                  src={user.image}
                  alt={displayName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-tfl-sky/30"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-tfl-sky/10 border-2 border-tfl-sky/20 flex items-center justify-center">
                  <span className="font-display text-xl font-bold text-tfl-sky">{initial}</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="w-4 h-4 border-2 border-tfl-sky/30 border-t-tfl-sky rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-tfl-bone">{displayName}</h3>
              <p className="text-sm text-tfl-stone">{user.email}</p>
              {user.username && <p className="text-xs text-tfl-sky">@{user.username}</p>}
            </div>
          </div>

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-2 text-sm text-tfl-sky border border-tfl-sky/20 rounded-xl hover:bg-tfl-sky/10 transition-all disabled:opacity-50"
          >
            {uploading ? "Subiendo..." : "Cambiar foto de perfil"}
          </button>

          <div className="flex items-center gap-2 mt-4">
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-tfl-sky/10 text-tfl-sky border border-tfl-sky/20">
              {user.role}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-tfl-slate/20 backdrop-blur-sm border border-tfl-sky/10 rounded-2xl p-6">
          <h3 className="font-semibold text-tfl-bone mb-4">Acciones Rápidas</h3>
          <div className="space-y-2">
            <a
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-tfl-stone hover:bg-tfl-sky/5 hover:text-tfl-bone transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuración
            </a>
            {user.role === "ADMIN" && (
              <a
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-tfl-stone hover:bg-tfl-sky/5 hover:text-tfl-bone transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Panel Admin
              </a>
            )}
          </div>
        </div>

        {/* Stats Placeholder */}
        <div className="bg-tfl-slate/20 backdrop-blur-sm border border-tfl-sky/10 rounded-2xl p-6">
          <h3 className="font-semibold text-tfl-bone mb-4">Estadísticas</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-tfl-stone">Mensajes enviados</span>
              <span className="text-tfl-bone font-medium">0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-tfl-stone">Posts creados</span>
              <span className="text-tfl-bone font-medium">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}