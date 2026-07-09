"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const strengthLabels = ["Muy débil", "Débil", "Media", "Fuerte", "Muy fuerte"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: `${formData.get("firstName")} ${formData.get("lastName")}`,
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    if (data.password !== data.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Error al registrarse");
        return;
      }

      // Guardar token
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
          <h1 className="font-display text-3xl font-bold text-tfl-bone mb-2">Crear Cuenta</h1>
          <p className="text-tfl-stone">Únete a la comunidad TFLives</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-tfl-stone mb-2">Nombre</label>
              <input
                name="firstName"
                type="text"
                required
                className="w-full px-4 py-3 bg-tfl-slate/30 border border-tfl-sky/20 rounded-xl text-tfl-bone placeholder-tfl-stone/50 focus:outline-none focus:border-tfl-sky/50 focus:ring-1 focus:ring-tfl-sky/30 transition-all"
                placeholder="Jonathan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-tfl-stone mb-2">Apellido</label>
              <input
                name="lastName"
                type="text"
                required
                className="w-full px-4 py-3 bg-tfl-slate/30 border border-tfl-sky/20 rounded-xl text-tfl-bone placeholder-tfl-stone/50 focus:outline-none focus:border-tfl-sky/50 focus:ring-1 focus:ring-tfl-sky/30 transition-all"
                placeholder="Thompson"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-tfl-stone mb-2">Username</label>
            <input
              name="username"
              type="text"
              required
              className="w-full px-4 py-3 bg-tfl-slate/30 border border-tfl-sky/20 rounded-xl text-tfl-bone placeholder-tfl-stone/50 focus:outline-none focus:border-tfl-sky/50 focus:ring-1 focus:ring-tfl-sky/30 transition-all"
              placeholder="jonathanthxd"
            />
          </div>

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
              onChange={(e) => checkStrength(e.target.value)}
              className="w-full px-4 py-3 bg-tfl-slate/30 border border-tfl-sky/20 rounded-xl text-tfl-bone placeholder-tfl-stone/50 focus:outline-none focus:border-tfl-sky/50 focus:ring-1 focus:ring-tfl-sky/30 transition-all"
              placeholder="••••••••"
            />
            {/* Strength meter */}
            <div className="mt-2">
              <div className="flex gap-1 h-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-300 ${
                      i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-tfl-slate/50"
                    }`}
                  />
                ))}
              </div>
              {passwordStrength > 0 && (
                <p className={`text-xs mt-1 ${strengthColors[passwordStrength - 1].replace("bg-", "text-")}`}>
                  {strengthLabels[passwordStrength - 1]}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-tfl-stone mb-2">Confirmar Contraseña</label>
            <input
              name="confirmPassword"
              type="password"
              required
              className="w-full px-4 py-3 bg-tfl-slate/30 border border-tfl-sky/20 rounded-xl text-tfl-bone placeholder-tfl-stone/50 focus:outline-none focus:border-tfl-sky/50 focus:ring-1 focus:ring-tfl-sky/30 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-tfl-sky/10 border border-tfl-sky/30 rounded-xl text-tfl-sky font-medium hover:bg-tfl-sky/20 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </button>

          <p className="text-center text-sm text-tfl-stone">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="text-tfl-sky hover:text-tfl-pastel transition-colors">
              Iniciar sesión
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}