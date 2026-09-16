"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MousePointer2, Sparkles } from "lucide-react";
import {
  getCursorCssValue,
  type StudioCursorPack,
  type StudioCursorRole,
} from "@/shared/studio/cursors";

const PREVIEW_ROLES = ["default", "pointer", "text"] as const satisfies readonly StudioCursorRole[];

export function CursorPackPreview({
  pack,
  animatedLabel,
  roleLabels,
}: {
  pack: StudioCursorPack;
  animatedLabel: string;
  roleLabels: Record<"default" | "pointer" | "text", string>;
}) {
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);

  useEffect(() => {
    if (!active || !pack.animated) {
      setElapsed(0);
      return;
    }

    startedAt.current = performance.now();
    const timer = window.setInterval(() => {
      setElapsed(performance.now() - startedAt.current);
    }, 48);
    return () => window.clearInterval(timer);
  }, [active, pack.animated]);

  const roleCursors = useMemo(
    () =>
      Object.fromEntries(
        PREVIEW_ROLES.map((role) => [
          role,
          pack.id === "system"
            ? role === "default"
              ? "default"
              : role === "pointer"
                ? "pointer"
                : "text"
            : getCursorCssValue(pack, role, elapsed),
        ]),
      ) as Partial<Record<StudioCursorRole, string | undefined>>,
    [elapsed, pack],
  );

  return (
    <div
      className="studio-cursor-preview relative overflow-hidden"
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
    >
      <div className="studio-cursor-preview__ambient" aria-hidden="true" />
      <div className="relative flex min-h-20 items-center gap-2 px-2.5 py-2.5">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/[0.10] bg-black/[0.15] shadow-inner">
          {pack.preview ? (
            <img
              src={pack.preview}
              alt=""
              width={48}
              height={48}
              className="size-9 object-contain [image-rendering:auto]"
              draggable={false}
            />
          ) : (
            <MousePointer2 className="size-7 text-foreground/80" strokeWidth={1.45} aria-hidden="true" />
          )}
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-3 gap-1">
          {PREVIEW_ROLES.map((role) => (
            <span
              key={role}
              className="studio-cursor-preview__zone grid min-h-10 place-items-center rounded-lg border border-white/[0.08] bg-black/[0.10] px-0.5 text-center text-[8px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
              style={{ cursor: roleCursors[role] }}
            >
              {roleLabels[role]}
            </span>
          ))}
        </div>

        {pack.animated && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/[0.10] bg-black/[0.25] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/75 backdrop-blur-sm">
            <Sparkles className="size-2.5" aria-hidden="true" />
            {animatedLabel}
          </span>
        )}
      </div>
    </div>
  );
}
