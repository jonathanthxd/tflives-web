"use client";

import { X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useEffect, useId, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}
      onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}
      onClick={event => { if (event.target === event.currentTarget && !busy) onCancel(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto border-0 bg-transparent p-4 backdrop:bg-black/50 backdrop:backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        aria-busy={busy}
        className="tfl-glass tfl-glass-strong relative w-full max-w-sm rounded-2xl border p-5 animate-in fade-in-0 zoom-in-95 duration-150 sm:p-6"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label={cancelLabel}
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <h2 id={`${id}-title`} className="pr-10 font-display text-lg font-semibold text-foreground mb-2">{title}</h2>
        {description && <p id={`${id}-description`} className="text-sm text-muted-foreground mb-6">{description}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
