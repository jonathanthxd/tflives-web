"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { EMOJI_CATEGORIES, type EmojiCategory } from "@/modules/chat/emojis";

export interface PickerSticker {
  id: string;
  name: string;
  assetUrl: string;
  category: string | null;
}

export interface PickerCustomEmoji {
  id: string;
  name: string;
  assetUrl: string;
}

interface PickerLabels {
  emojis: string;
  stickers: string;
  emptyStickers: string;
  customEmojis?: string;
}

interface EmojiStickerPickerProps {
  onEmojiSelect: (emoji: string) => void;
  stickers?: PickerSticker[];
  onStickerSelect?: (stickerId: string) => void;
  customEmojis?: PickerCustomEmoji[];
  onCustomEmojiSelect?: (emoji: PickerCustomEmoji) => void;
  labels: PickerLabels;
  reactionOnly?: boolean;
  className?: string;
}

/**
 * TFLives-owned emoji/sticker manager. It never opens the operating-system
 * picker. Only one Unicode category is rendered at a time to keep the DOM and
 * mobile layout lightweight even though the catalogue is broad.
 *
 * `customEmojis` is intentionally part of the public component contract so a
 * future admin-backed custom emoji catalogue can plug in without redesigning
 * the picker. No custom emoji backend is required by the current release.
 */
export default function EmojiStickerPicker({
  onEmojiSelect,
  stickers = [],
  onStickerSelect,
  customEmojis = [],
  onCustomEmojiSelect,
  labels,
  reactionOnly = false,
  className = "",
}: EmojiStickerPickerProps) {
  const [tab, setTab] = useState<"emoji" | "stickers">("emoji");
  const [category, setCategory] = useState<EmojiCategory["id"]>(EMOJI_CATEGORIES[0].id);

  const activeCategory = useMemo(
    () => EMOJI_CATEGORIES.find((item) => item.id === category) ?? EMOJI_CATEGORIES[0],
    [category],
  );

  return (
    <div className={`w-[17rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card/98 shadow-2xl shadow-black/25 backdrop-blur-xl ${className}`}>
      {!reactionOnly && (
        <div className="grid grid-cols-2 border-b border-border p-1">
          <button
            type="button"
            onClick={() => setTab("emoji")}
            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${tab === "emoji" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"}`}
          >
            {labels.emojis}
          </button>
          <button
            type="button"
            onClick={() => setTab("stickers")}
            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${tab === "stickers" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"}`}
          >
            {labels.stickers}
          </button>
        </div>
      )}

      {(reactionOnly || tab === "emoji") && (
        <>
          <div className="flex items-center gap-0.5 overflow-x-auto border-b border-border px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {EMOJI_CATEGORIES.map((item) => (
              <button
                type="button"
                key={item.id}
                title={item.id}
                aria-label={item.id}
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base transition-colors ${category === item.id ? "bg-primary/12" : "hover:bg-primary/7"}`}
              >
                {item.icon}
              </button>
            ))}
          </div>

          <div className="max-h-52 overflow-y-auto p-1.5">
            {!!customEmojis.length && !reactionOnly && (
              <div className="mb-2 border-b border-border pb-2">
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {labels.customEmojis ?? "Custom"}
                </p>
                <div className="grid grid-cols-7 gap-0.5">
                  {customEmojis.map((emoji) => (
                    <button
                      type="button"
                      key={emoji.id}
                      title={`:${emoji.name}:`}
                      onClick={() => onCustomEmojiSelect?.(emoji)}
                      className="grid aspect-square place-items-center rounded-lg p-1 hover:bg-primary/10"
                    >
                      <img src={emoji.assetUrl} alt={emoji.name} className="h-6 w-6 object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-8 gap-0.5">
              {activeCategory.emojis.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => onEmojiSelect(emoji)}
                  className="grid aspect-square place-items-center rounded-lg text-[1.2rem] leading-none transition-transform hover:scale-110 hover:bg-primary/10 focus-visible:bg-primary/10"
                  aria-label={emoji}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {!reactionOnly && tab === "stickers" && (
        <div className="max-h-56 overflow-y-auto p-2">
          {stickers.length ? (
            <div className="grid grid-cols-4 gap-1">
              {stickers.map((sticker) => (
                <button
                  type="button"
                  key={sticker.id}
                  onClick={() => onStickerSelect?.(sticker.id)}
                  title={sticker.name}
                  className="grid aspect-square place-items-center rounded-xl p-1.5 transition-colors hover:bg-primary/10"
                >
                  <img src={sticker.assetUrl} alt={sticker.name} className="h-12 w-12 object-contain" />
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">{labels.emptyStickers}</p>
          )}
        </div>
      )}
    </div>
  );
}
