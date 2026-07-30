"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DiscordData {
  presence_count: number;
  member_count: number | null;
}

export default function DiscordWidget() {
  const [data, setData] = useState<DiscordData | null>(null);
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/discord");
        if (!res.ok) throw new Error("API error");
        const json = await res.json();
        setData(json);
      } catch {
        setData({ presence_count: 0, member_count: null });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // El número que se muestra en el botón: preferiblemente el total de miembros, o en línea si no hay total
  const displayCount = data?.member_count ?? data?.presence_count ?? 0;
  const showOnline = data?.presence_count ?? 0;

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Botón principal */}
      <a
        href="https://discord.com/invite/c3jFPyJ9vd"
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center gap-3 px-5 py-3 bg-gradient-to-br from-[#5865F2] to-[#4752C4] backdrop-blur-md border border-white/10 rounded-2xl text-white font-medium shadow-lg shadow-[#5865F2]/20 hover:shadow-[#5865F2]/40 hover:scale-105 active:scale-95 transition-all duration-300 group"
      >
        {/* Icono de Discord con leve rotación al hover */}
        <motion.svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
        </motion.svg>

        <span className="text-sm font-semibold tracking-wide">Discord</span>

        {/* Contador principal (miembros totales) */}
        <div className="flex items-center gap-1.5 ml-1">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </div>
          {!loading && (
            <span className="text-xs font-bold tabular-nums">
              {displayCount.toLocaleString()}
            </span>
          )}
          {loading && (
            <span className="w-6 h-3 bg-white/20 rounded animate-pulse" />
          )}
        </div>
      </a>

      {/* Tooltip / tarjeta expandible */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-3 w-72 bg-background/95 backdrop-blur-xl border border-primary/20 rounded-2xl p-5 shadow-2xl shadow-black/50"
          >
            {/* Encabezado */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#5865F2]/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#5865F2]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515..." />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  TFLives
                </h4>
                <p className="text-xs text-muted-foreground">Servidor oficial</p>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="space-y-3">
              {/* Miembros totales */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Miembros totales
                </span>
                <span className="text-foreground font-bold tabular-nums">
                  {displayCount.toLocaleString()}
                </span>
              </div>

              {/* En línea */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  En línea ahora
                </span>
                <span className="text-foreground font-bold tabular-nums">
                  {showOnline.toLocaleString()}
                </span>
              </div>

              {/* Barra de proporción */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Actividad</span>
                  <span>
                    {data?.member_count
                      ? `${Math.round((showOnline / displayCount) * 100)}%`
                      : "—"}
                  </span>
                </div>
                <div className="w-full h-2 bg-card/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: data?.member_count
                        ? `${Math.min(
                            (showOnline / displayCount) * 100,
                            100
                          )}%`
                        : "100%",
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* Pie */}
            <div className="mt-4 pt-3 border-t border-primary/10">
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                ¡Únete ahora!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}