"use client";

import "./cursor-pack-preview.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { MousePointer2, Sparkles } from "lucide-react";
import {
  getCursorAnimationInterval,
  getCursorCssValue,
  type StudioCursorPack,
  type StudioCursorRole,
} from "@/shared/studio/cursors";

const PREVIEW_ROLES = ["default", "pointer", "text", "wait"] as const satisfies readonly StudioCursorRole[];

export function CursorPackPreview({
  pack,
  animatedLabel,
  roleLabels,
}: {
  pack: StudioCursorPack;
  animatedLabel: string;
  roleLabels: Record<"default" | "pointer" | "text" | "wait", string>;
}) {
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const animationInterval = getCursorAnimationInterval(pack);

  useEffect(() => {
    if (!active || !animationInterval) {
      return;
    }

    startedAt.current = performance.now();
    const timer = window.setInterval(() => {
      setElapsed(performance.now() - startedAt.current);
    }, animationInterval);
    return () => window.clearInterval(timer);
  }, [active, animationInterval]);

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
                : role === "text"
                  ? "text"
                  : "wait"
            : getCursorCssValue(pack, role, active && animationInterval ? elapsed : 0),
        ]),
      ) as Partial<Record<StudioCursorRole, string | undefined>>,
    [active, animationInterval, elapsed, pack],
  );

  return (
    <div
      className="studio-cursor-preview relative overflow-hidden"
      onPointerEnter={() => { setElapsed(0); setActive(true); }}
      onPointerLeave={() => setActive(false)}
    >
      <div className="studio-cursor-preview__ambient" aria-hidden="true" />
      <div className="relative flex min-h-[5.75rem] items-center gap-3 px-3 py-3">
        <div className="studio-cursor-preview__hero grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/[0.11] bg-black/[0.14] shadow-inner">
          {pack.preview ? (
            <img
              src={pack.preview}
              alt=""
              width={112}
              height={88}
              className="h-full w-full object-cover [image-rendering:auto]"
              draggable={false}
            />
          ) : (
            <MousePointer2 className="size-8 text-foreground/80" strokeWidth={1.35} aria-hidden="true" />
          )}
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
          {PREVIEW_ROLES.map((role) => (
            <span
              key={role}
              className="studio-cursor-preview__zone grid min-h-9 place-items-center rounded-xl border border-white/[0.08] bg-black/[0.08] px-1 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
              style={{ cursor: roleCursors[role] }}
            >
              {roleLabels[role]}
            </span>
          ))}
        </div>

        {animationInterval && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/[0.10] bg-black/[0.28] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/78 backdrop-blur-md">
            <Sparkles className="size-2.5" aria-hidden="true" />
            {animatedLabel}
          </span>
        )}
      </div>
    </div>
  );
}
