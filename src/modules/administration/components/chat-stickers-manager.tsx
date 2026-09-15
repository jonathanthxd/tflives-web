"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Sticker { id: string; name: string; assetUrl: string; enabled: boolean; displayOrder: number; category: string | null }

export default function ChatStickersManager({ initialStickers }: { initialStickers: Sticker[] }) {
  const t = useTranslations("AdminChat");
  const [stickers, setStickers] = useState(initialStickers);
  const [name, setName] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(body: Record<string, unknown>, method: "POST" | "PATCH") {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/admin/chat/stickers", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || t("stickerError")); return null; }
      return data.sticker as Sticker;
    } finally { setSaving(false); }
  }

  async function create() {
    const sticker = await save({ name, assetUrl }, "POST");
    if (sticker) { setStickers((current) => [...current, sticker].sort((a, b) => a.displayOrder - b.displayOrder)); setName(""); setAssetUrl(""); }
  }

  async function toggle(sticker: Sticker) {
    const updated = await save({ ...sticker, enabled: !sticker.enabled }, "PATCH");
    if (updated) setStickers((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  return (
    <section className="tfl-glass tfl-glass-soft rounded-2xl border border-primary/10 p-5">
      <h2 className="font-display text-lg font-semibold text-foreground">{t("stickersTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("stickersDescription")}</p>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("stickerName")} className="rounded-lg border border-input bg-input/20 px-3 py-2 text-sm" />
        <input value={assetUrl} onChange={(event) => setAssetUrl(event.target.value)} placeholder="https://…" className="rounded-lg border border-input bg-input/20 px-3 py-2 text-sm" />
        <button disabled={saving || !name.trim() || !assetUrl.trim()} onClick={create} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{t("add")}</button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stickers.map((sticker) => <div key={sticker.id} className={`rounded-xl border p-2 ${sticker.enabled ? "border-border" : "border-dashed border-muted-foreground/30 opacity-60"}`}>
          {/* Official assets are reviewed before their HTTPS URL is added. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sticker.assetUrl} alt={sticker.name} className="mx-auto h-14 w-14 object-contain" />
          <p className="truncate text-center text-xs text-foreground">{sticker.name}</p>
          <button disabled={saving} onClick={() => toggle(sticker)} className="mt-1 w-full rounded-md px-2 py-1 text-[11px] text-primary hover:bg-primary/10 disabled:opacity-50">{sticker.enabled ? t("disable") : t("enable")}</button>
        </div>)}
      </div>
    </section>
  );
}
