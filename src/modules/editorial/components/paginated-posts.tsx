"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import PostCard, { type PostCardProps } from "./post-card";
import { readJsonResponse } from "@/shared/lib/http";
type Item = PostCardProps & { id: string };
export default function PaginatedPosts({ initial, hasMore: initialMore, modalityId, type, locale, pageSize }: { initial: Item[]; hasMore: boolean; modalityId?: string; type?: string; locale: string; pageSize: number }) {
  const t = useTranslations("Completion");
  const [items, setItems] = useState(initial);
  const [offset, setOffset] = useState(initial.length);
  const [more, setMore] = useState(initialMore);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function loadMore() {
    if (busy) return;
    setBusy(true); setFailed(false);
    try {
      const query = new URLSearchParams({ offset: String(offset), limit: String(pageSize), locale });
      if (modalityId) query.set("modality", modalityId);
      if (type) query.set("type", type);
      const data = await fetch("/api/posts?" + query, { cache: "no-store" }).then(readJsonResponse);
      setItems((previous) => [...previous, ...data.items.filter((item: Item) => !previous.some((existing) => existing.id === item.id))]);
      setOffset(data.nextOffset); setMore(data.hasMore);
    } catch { setFailed(true); } finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <PostCard key={item.id} {...item} />)}</div>
    {failed && <p role="alert" className="text-sm text-destructive">{t("loadError")}</p>}
    {more && <button disabled={busy} onClick={loadMore} className="rounded-xl border border-primary/30 px-5 py-3 text-sm text-primary disabled:opacity-50">{busy ? t("loading") : failed ? t("retry") : t("loadMore")}</button>}
  </div>;
}
