"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SafeButton from "@/components/ui/safe-button"; // ✅ Import del SafeButton

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Error al iniciar sesión");
        return;
      }

      localStorage.setItem("tfl_token", result.token);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center pt-20 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-tfl-bone mb-2">Iniciar Sesión</h1>
          <p className="text-tfl-stone">Bienvenido de vuelta a TFLives</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-tfl-stone mb-2">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 bg-tfl-slate/30 border border-tfl-sky/20 rounded-xl text-tfl-bone placeholder-tfl-stone/50 focus:outline-none focus:border-tfl-sky/50 focus:ring-1 focus:ring-tfl-sky/30 transition-all"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-tfl-stone mb-2">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 bg-tfl-slate/30 border border-tfl-sky/20 rounded-xl text-tfl-bone placeholder-tfl-stone/50 focus:outline-none focus:border-tfl-sky/50 focus:ring-1 focus:ring-tfl-sky/30 transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* ✅ Usamos SafeButton para evitar hydration error */}
          <SafeButton
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-tfl-sky/10 border border-tfl-sky/30 rounded-xl text-tfl-sky font-medium hover:bg-tfl-sky/20 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </SafeButton>

          <p className="text-center text-sm text-tfl-stone">
            ¿No tienes cuenta?{" "}
            <a href="/register" className="text-tfl-sky hover:text-tfl-pastel transition-colors">
              Crear cuenta
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}