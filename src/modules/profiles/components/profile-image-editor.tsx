"use client";
import { useObjectUrl } from "@/shared/lib/client-value";

import { ImageIcon, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/shared/ui/button";

type ProfileImageKind = "avatar" | "banner";

type Point = { x: number; y: number };
type Size = { width: number; height: number };

const OUTPUT_SIZE: Record<ProfileImageKind, Size> = {
  avatar: { width: 1024, height: 1024 },
  banner: { width: 1920, height: 640 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function constrainedPosition(
  position: Point,
  image: Size,
  viewport: Size,
  zoom: number,
): Point {
  if (!image.width || !image.height || !viewport.width || !viewport.height) return { x: 0, y: 0 };
  const baseScale = Math.max(viewport.width / image.width, viewport.height / image.height);
  const renderedWidth = image.width * baseScale * zoom;
  const renderedHeight = image.height * baseScale * zoom;
  const maxX = Math.max(0, (renderedWidth - viewport.width) / 2);
  const maxY = Math.max(0, (renderedHeight - viewport.height) / 2);
  return {
    x: clamp(position.x, -maxX, maxX),
    y: clamp(position.y, -maxY, maxY),
  };
}

async function canvasToFile(canvas: HTMLCanvasElement, source: File) {
  const type = "image/webp";
  const qualities = [0.9, 0.84, 0.78, 0.72];
  let blob: Blob | null = null;

  for (const quality of qualities) {
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Unable to export image")), type, quality);
    });
    if (blob.size <= 1_900_000) break;
  }

  if (!blob) throw new Error("Unable to export image");
  const stem = source.name.replace(/\.[^.]+$/, "") || "profile-image";
  return new File([blob], `${stem}.webp`, { type, lastModified: Date.now() });
}

export function ProfileImageEditor({
  file,
  kind,
  labels,
  onCancel,
  onConfirm,
}: {
  file: File;
  kind: ProfileImageKind;
  labels: {
    title: string;
    description: string;
    zoom: string;
    reset: string;
    cancel: string;
    apply: string;
    processing: string;
  };
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; origin: Point; start: Point } | null>(null);
  const id = useId();
  const sourceUrl = useObjectUrl(file);
  const [imageSize, setImageSize] = useState<Size>({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState<Size>({ width: 0, height: 0 });
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [processing, setProcessing] = useState(false);
  const output = OUTPUT_SIZE[kind];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => {
      const rect = viewport.getBoundingClientRect();
      const next = { width: rect.width, height: rect.height };
      setViewportSize(next);
      setPosition((value) => constrainedPosition(value, imageSize, next, zoom));
    };
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    update();
    return () => observer.disconnect();
  }, [imageSize, zoom]);

  const rendered = useMemo(() => {
    if (!imageSize.width || !viewportSize.width) return { scale: 1, width: 0, height: 0 };
    const baseScale = Math.max(viewportSize.width / imageSize.width, viewportSize.height / imageSize.height);
    return {
      scale: baseScale * zoom,
      width: imageSize.width * baseScale * zoom,
      height: imageSize.height * baseScale * zoom,
    };
  }, [imageSize, viewportSize, zoom]);

  function reset() {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (processing) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      origin: { x: event.clientX, y: event.clientY },
      start: position,
    };
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPosition(constrainedPosition({
      x: drag.start.x + event.clientX - drag.origin.x,
      y: drag.start.y + event.clientY - drag.origin.y,
    }, imageSize, viewportSize, zoom));
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  async function apply() {
    if (!sourceUrl || !imageSize.width || !viewportSize.width || processing) return;
    setProcessing(true);
    try {
      const image = new Image();
      image.decoding = "async";
      image.src = sourceUrl;
      await image.decode();

      const scale = rendered.scale;
      const sx = clamp((rendered.width / 2 - viewportSize.width / 2 - position.x) / scale, 0, imageSize.width);
      const sy = clamp((rendered.height / 2 - viewportSize.height / 2 - position.y) / scale, 0, imageSize.height);
      const sw = Math.min(viewportSize.width / scale, imageSize.width - sx);
      const sh = Math.min(viewportSize.height / scale, imageSize.height - sy);

      const canvas = document.createElement("canvas");
      canvas.width = output.width;
      canvas.height = output.height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas unavailable");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, sx, sy, sw, sh, 0, 0, output.width, output.height);
      await onConfirm(await canvasToFile(canvas, file));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => { event.preventDefault(); if (!processing) onCancel(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !processing) onCancel(); }}
      className="m-auto max-h-[100dvh] w-full max-w-3xl overflow-y-auto border-0 bg-transparent p-3 backdrop:bg-black/65 backdrop:backdrop-blur-md sm:p-5"
    >
      <div className="tfl-glass tfl-glass-strong relative overflow-hidden rounded-[1.75rem] border p-4 shadow-2xl sm:p-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          aria-label={labels.cancel}
          className="absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full text-muted-foreground transition hover:bg-muted/70 hover:text-foreground disabled:opacity-50 sm:right-4 sm:top-4"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div className="pr-12">
          <div className="mb-1 flex items-center gap-2 text-primary">
            <ImageIcon className="size-4" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">TFL Studio</span>
          </div>
          <h2 id={`${id}-title`} className="font-display text-xl font-semibold text-foreground sm:text-2xl">{labels.title}</h2>
          <p id={`${id}-description`} className="mt-1 text-sm text-muted-foreground">{labels.description}</p>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_11rem]">
          <div
            ref={viewportRef}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={`relative isolate w-full touch-none select-none overflow-hidden border border-white/10 bg-black/80 shadow-inner cursor-grab active:cursor-grabbing ${kind === "avatar" ? "mx-auto max-w-md aspect-square rounded-[2rem]" : "aspect-[3/1] rounded-2xl"}`}
          >
            {sourceUrl && (
              <img
                src={sourceUrl}
                alt=""
                draggable={false}
                onLoad={(event) => {
                  const image = event.currentTarget;
                  setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
                }}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none origin-center will-change-transform"
                style={{
                  width: imageSize.width || undefined,
                  height: imageSize.height || undefined,
                  transform: `translate(-50%, -50%) translate3d(${position.x}px, ${position.y}px, 0) scale(${rendered.scale})`,
                }}
              />
            )}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/15" />
            {kind === "avatar" && (
              <div className="pointer-events-none absolute inset-[8%] rounded-full border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.28),0_0_28px_rgba(0,0,0,0.45)]" />
            )}
          </div>

          <div className="flex flex-col justify-between gap-5">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor={`${id}-zoom`} className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{labels.zoom}</label>
                <span className="font-mono text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setZoom((value) => clamp(value - 0.1, 1, 3))} className="tfl-glass-chip grid size-9 shrink-0 place-items-center rounded-full" aria-label="-">
                  <Minus className="size-3.5" aria-hidden="true" />
                </button>
                <input
                  id={`${id}-zoom`}
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-full accent-primary"
                />
                <button type="button" onClick={() => setZoom((value) => clamp(value + 0.1, 1, 3))} className="tfl-glass-chip grid size-9 shrink-0 place-items-center rounded-full" aria-label="+">
                  <Plus className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={reset} className="mt-3 w-full" disabled={processing}>
                <RotateCcw className="size-3.5" aria-hidden="true" data-icon="inline-start" />
                {labels.reset}
              </Button>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/30 p-3 text-xs leading-relaxed text-muted-foreground">
              {kind === "avatar" ? "1:1 · 1024 × 1024 WebP" : "3:1 · 1920 × 640 WebP"}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={processing}>{labels.cancel}</Button>
          <Button type="button" onClick={() => void apply()} disabled={processing || !imageSize.width}>
            {processing ? labels.processing : labels.apply}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
