"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Palette } from "lucide-react";

const loadPanel = () => import("./studio-panel");
const StudioPanel = dynamic(loadPanel, {
  loading: () => <div aria-busy="true" className="grid min-h-20 place-items-center"><span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /></div>,
});

export default function StudioMenu({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("Studio");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onPointerEnter={() => { void loadPanel(); }}
        onFocus={() => { void loadPanel(); }}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("open")}
        title={t("open")}
        className={`grid min-h-11 min-w-11 place-items-center transition-[color,background-color,border-radius] duration-300 ${compact ? "rounded-full" : "rounded-xl"} ${open ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"}`}
      >
        <Palette className="size-5" strokeWidth={1.7} aria-hidden="true" />
      </button>
      {open && (
        <div role="dialog" aria-label={t("title")}
          className={`tfl-glass tfl-glass-strong absolute left-0 z-[80] flex max-h-[calc(100dvh-6rem)] w-[calc(100vw-1.5rem)] max-w-[28rem] flex-col overflow-hidden rounded-3xl border ${compact ? "top-[calc(100%+0.75rem)]" : "top-[calc(100%+0.75rem)] md:top-[calc(100%+1.125rem)]"}`}>
          <StudioPanel onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
