"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { AdminSearchGroup } from "@/modules/administration/platform-service";

const EMPTY_RESULTS: AdminSearchGroup[] = [];

export function AdminGlobalSearch() {
  const t = useTranslations("AdminPlatform");
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<AdminSearchGroup[]>(EMPTY_RESULTS);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const items = groups.flatMap((group) => group.items);

  useEffect(() => {
    function focusSearch(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !target?.matches("input, textarea, [contenteditable='true']"))) {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    const normalized = query.trim();
    setActiveIndex(0);
    if (normalized.length < 2) {
      setGroups(EMPTY_RESULTS);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(normalized)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("search_failed");
        const data = await response.json() as { groups?: AdminSearchGroup[] };
        setGroups(data.groups ?? EMPTY_RESULTS);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setGroups(EMPTY_RESULTS);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query]);

  function close() {
    setOpen(false);
    setActiveIndex(0);
  }

  function navigate(href: string) {
    close();
    setQuery("");
    router.push(href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { close(); inputRef.current?.blur(); return; }
    if (!items.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => (index + 1) % items.length); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => (index - 1 + items.length) % items.length); }
    if (event.key === "Enter") { event.preventDefault(); const item = items[activeIndex]; if (item) navigate(item.href); }
  }

  const showResults = open && query.trim().length >= 2;
  let itemIndex = -1;

  return (
    <div className="relative w-full max-w-xl">
      <label className="sr-only" htmlFor={inputId}>{t("searchLabel")}</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        ref={inputRef}
        id={inputId}
        value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t("searchPlaceholder")}
        role="combobox"
        aria-expanded={showResults}
        aria-controls={`${inputId}-results`}
        aria-autocomplete="list"
        className="h-10 w-full rounded-xl border border-border bg-background/80 py-2 pl-10 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
      />
      {query && <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-foreground" aria-label={t("clearSearch")}><X className="h-3.5 w-3.5" /></button>}
      {showResults && (
        <div id={`${inputId}-results`} role="listbox" className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(65vh,32rem)] overflow-y-auto rounded-xl border border-primary/15 bg-popover p-2 shadow-2xl">
          {loading ? <p className="px-3 py-4 text-sm text-muted-foreground">{t("searching")}</p> : groups.length === 0 ? <p className="px-3 py-4 text-sm text-muted-foreground">{t("noSearchResults")}</p> : groups.map((group) => (
            <div key={group.id} className="py-1">
              <p className="px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">{t(`search${group.id.charAt(0).toUpperCase()}${group.id.slice(1)}`)}</p>
              {group.items.map((item) => {
                itemIndex += 1;
                const index = itemIndex;
                return <button key={`${group.id}-${item.id}`} type="button" role="option" aria-selected={index === activeIndex} onMouseDown={(event) => event.preventDefault()} onClick={() => navigate(item.href)} className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${index === activeIndex ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-primary/5"}`}><span className="min-w-0 truncate font-medium">{item.label}</span>{item.detail && <span className="max-w-[45%] truncate text-xs text-muted-foreground">{item.detail}</span>}</button>;
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
