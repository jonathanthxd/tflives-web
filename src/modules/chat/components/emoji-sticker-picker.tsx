"use client";

import dynamic from "next/dynamic";
import type { AnchoredEmojiStickerPickerProps } from "./emoji-sticker-picker-content";
export type { PickerSticker, PickerCustomEmoji, PickerAnchorRect } from "./emoji-sticker-picker-content";

const loadPicker = () => import("./emoji-sticker-picker-content");
const Picker = dynamic(() => loadPicker().then((module) => module.AnchoredEmojiStickerPicker), { loading: () => null });

export function preloadEmojiPicker() { void loadPicker(); }

export function AnchoredEmojiStickerPicker(props: AnchoredEmojiStickerPickerProps) {
  return props.open ? <Picker {...props} /> : null;
}
