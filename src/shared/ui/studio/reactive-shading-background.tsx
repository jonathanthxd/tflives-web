"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/shared/utilities/utils";

const TARGET_SELECTOR = [
  "[data-studio-bloom]",
  "#page-content h1",
  "#page-content h2",
  "#page-content h3",
  "#page-content .text-primary",
].join(",");

function isVisible(rect: DOMRect) {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= window.innerHeight &&
    rect.left <= window.innerWidth
  );
}

export default function ReactiveShadingBackground({ className }: { className?: string }) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(TARGET_SELECTOR));
      const seen = new Set<HTMLElement>();

      const targets = nodes
        .filter((node) => {
          if (seen.has(node)) return false;
          seen.add(node);
          const rect = node.getBoundingClientRect();
          return isVisible(rect);
        })
        .map((node) => ({ node, rect: node.getBoundingClientRect() }))
        .sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height)
        .slice(0, 7);

      const blooms = targets.map(({ node, rect }) => {
        const style = window.getComputedStyle(node);
        const color = style.color || "hsl(var(--primary))";
        const x = Math.round(rect.left + rect.width / 2);
        const y = Math.round(rect.top + rect.height / 2);
        const radius = Math.round(Math.min(380, Math.max(120, Math.max(rect.width, rect.height) * 0.9)));

        return `radial-gradient(circle ${radius}px at ${x}px ${y}px, color-mix(in srgb, ${color} 24%, transparent), transparent 72%)`;
      });

      blooms.push(
        "radial-gradient(circle 42vw at 50% -12vh, hsl(var(--primary) / 0.12), transparent 70%)",
      );

      layer.style.backgroundImage = blooms.join(",");
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    schedule();
    const timers = [window.setTimeout(schedule, 250), window.setTimeout(schedule, 900)];

    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });

    const content = document.getElementById("page-content");
    const observer = new MutationObserver(schedule);
    if (content) {
      observer.observe(content, { childList: true, subtree: true });
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      timers.forEach(window.clearTimeout);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className={cn(
        "absolute inset-0 bg-background transition-[background-image] duration-300",
        className,
      )}
    />
  );
}
