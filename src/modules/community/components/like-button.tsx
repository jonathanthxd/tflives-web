"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export default function LikeButton({
  targetType,
  targetId,
  size = "sm",
}: {
  targetType: "POST" | "COMMENT";
  targetId: string;
  size?: "sm" | "lg";
}) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/community/reactions?targetType=${targetType}&targetId=${targetId}`)
      .then((res) => res.json())
      .then((data) => {
        setLiked(!!data.liked);
        setCount(typeof data.count === "number" ? data.count : 0);
      })
      .catch(() => setCount(0));
  }, [targetType, targetId]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const prevLiked = liked;
    const prevCount = count ?? 0;
    setLiked(!prevLiked);
    setCount(prevLiked ? prevCount - 1 : prevCount + 1);
    try {
      const res = await fetch("/api/community/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      if (!res.ok) {
        setLiked(prevLiked);
        setCount(prevCount);
        return;
      }
      const data = await res.json();
      setLiked(!!data.liked);
      setCount(typeof data.count === "number" ? data.count : prevCount);
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setBusy(false);
    }
  }

  const isLarge = size === "lg";

  return (
    <button
      onClick={toggle}
      disabled={count === null}
      className={`inline-flex items-center gap-2 rounded-full border transition-colors duration-200 disabled:opacity-50 ${
        isLarge ? "px-4 py-2 text-sm" : "px-2.5 py-1 text-xs"
      } ${
        liked
          ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
          : "border-border text-muted-foreground hover:border-red-500/30 hover:text-red-500"
      }`}
    >
      <Heart className={isLarge ? "h-4 w-4" : "h-3.5 w-3.5"} strokeWidth={1.75} fill={liked ? "currentColor" : "none"} />
      {count ?? " "}
    </button>
  );
}
