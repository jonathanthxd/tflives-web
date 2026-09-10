"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import MarkdownPreview from "./markdown-preview";
import { Button } from "@/shared/ui/button";

export default function ContentEditor({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  const t = useTranslations("Content");
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  function insert(before: string, after = "") {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    onChange(
      value.slice(0, start) +
        before +
        value.slice(start, end) +
        after +
        value.slice(end),
    );
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + before.length, end + before.length);
    });
  }
  return (
    <div className="rounded-xl border border-primary/20 bg-card/30 overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b border-border p-2">
        {(
          [
            ["heading", "\n## ", ""],
            ["bold", "**", "**"],
            ["list", "\n- ", ""],
            ["quote", "\n> ", ""],
            ["link", "[", "](https://)"],
          ] as const
        ).map(([key, before, after]) => (
          <Button
            key={key}
            type="button"
            variant="ghost"
            size="sm"
            disabled={preview}
            onClick={() => insert(before, after)}
          >
            {t(key)}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={preview}
          onClick={() => setPreview(!preview)}
        >
          {t(preview ? "edit" : "preview")}
        </Button>
      </div>
      {preview ? (
        <div className="min-h-64 p-5 break-words">
          <MarkdownPreview content={value} />
        </div>
      ) : (
        <textarea
          ref={ref}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={14}
          maxLength={100000}
          className="block w-full resize-y bg-transparent p-4 font-mono text-sm focus-visible:outline-primary"
        />
      )}
    </div>
  );
}
