"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Palette, X } from "lucide-react";
import { useStudio } from "@/providers/studio-provider";
import type { PublicIdentity } from "@/modules/profiles/types";
import { AccentControl, BackgroundSelect, ThemeControl } from "./studio-controls";

export type StudioIdentity = Pick<PublicIdentity, "name" | "displayName" | "username" | "image">;
const loadEditor = () => import("./studio-editor");
function EditorLoading() {
  const t = useTranslations("StudioV2");
  return <div role="status" className="grid h-full place-content-center gap-3 p-6 text-center">
    <Palette className="mx-auto size-7 text-primary" aria-hidden />
    <h2 className="font-display text-xl font-semibold">{t("title")}</h2>
    <p className="text-sm text-muted-foreground">{t("loading")}</p>
  </div>;
}
const StudioEditor = dynamic(loadEditor, { ssr: false, loading: EditorLoading });
class EditorBoundary extends Component<{ children: ReactNode; errorLabel: string; retryLabel: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div role="alert" className="grid h-full place-content-center gap-4 p-6 text-center">
      <p>{this.props.errorLabel}</p>
      <button type="button" className="min-h-11 rounded-xl bg-primary px-4 text-primary-foreground" onClick={() => window.location.reload()}>{this.props.retryLabel}</button>
    </div>;
    return this.props.children;
  }
}
function StudioDialog({ full, trigger, onClose, children }: {
  full: boolean; trigger: RefObject<HTMLButtonElement | null>; onClose: () => void; children: ReactNode;
}) {
  const t = useTranslations("Studio");
  const tv = useTranslations("StudioV2");
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const triggerElement = trigger.current;
    if (!dialog) return;
    const position = () => {
      if (full) return;
      const anchor = triggerElement?.getBoundingClientRect();
      const width = Math.min(360, window.innerWidth - 24);
      const top = Math.max(12, Math.min((anchor?.bottom ?? 60) + 10, window.innerHeight - 120));
      dialog.style.left = `${Math.max(12, Math.min(anchor?.left ?? 12, window.innerWidth - width - 12))}px`;
      dialog.style.top = `${top}px`;
      dialog.style.maxHeight = `${window.innerHeight - top - 12}px`;
    };
    position();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    window.addEventListener("resize", position);
    return () => {
      window.removeEventListener("resize", position);
      dialog.close();
      document.body.style.overflow = overflow;
      if (triggerElement?.isConnected) triggerElement.focus({ preventScroll: true });
    };
  }, [full, trigger]);
  return <dialog ref={ref} aria-label={full ? tv("title") : tv("quickTitle")} data-studio-editor={full ? "true" : undefined} data-studio-quick={!full ? "true" : undefined}
    onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    className={full ? "m-auto h-[100dvh] max-h-none w-screen max-w-none overflow-hidden border-0 bg-card p-0 text-foreground backdrop:bg-black/55 backdrop:backdrop-blur-sm sm:h-[min(88dvh,900px)] sm:w-[calc(100vw-3rem)] sm:max-w-[1280px] sm:rounded-3xl sm:border sm:border-border" : "tfl-glass tfl-glass-strong fixed m-0 w-[min(360px,calc(100vw-24px))] overflow-y-auto rounded-3xl border p-0 text-foreground shadow-2xl backdrop:bg-black/20"}>
    <button type="button" autoFocus onClick={onClose} aria-label={t("close")} className="absolute right-3 top-3 z-30 grid size-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" aria-hidden /></button>
    {children}
  </dialog>;
}

export default function StudioMenu({ compact = false, identity }: { compact?: boolean; identity?: StudioIdentity }) {
  const t = useTranslations("Studio");
  const tv = useTranslations("StudioV2");
  const { ready } = useStudio();
  const [quick, setQuick] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={trigger} type="button" onClick={() => setQuick(true)} aria-expanded={quick || advanced} aria-haspopup="dialog" aria-label={t("open")} title={t("open")}
      className={`grid min-h-11 min-w-11 place-items-center transition-colors ${compact ? "rounded-full" : "rounded-xl"} ${quick || advanced ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"}`}><Palette className="size-5" strokeWidth={1.7} aria-hidden /></button>
    {ready && quick && createPortal(<StudioDialog full={false} trigger={trigger} onClose={() => setQuick(false)}>
      <div className="border-b border-border px-5 py-5 pr-16"><h2 className="font-display text-base font-semibold">{tv("quickTitle")}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{tv("quickHint")}</p></div>
      <div className="space-y-5 p-5">
        <section><h3 className="mb-2 text-xs font-semibold text-muted-foreground">{t("theme")}</h3><ThemeControl /></section>
        <section><h3 className="mb-2 text-xs font-semibold text-muted-foreground">{t("accent")}</h3><AccentControl /></section>
        <section><h3 className="mb-2 text-xs font-semibold text-muted-foreground">{t("backgrounds")}</h3><BackgroundSelect /></section>
        <button type="button" onPointerEnter={() => { void loadEditor().catch(() => {}); }} onFocus={() => { void loadEditor().catch(() => {}); }}
          onClick={() => { setQuick(false); setAdvanced(true); }} className="flex min-h-12 w-full items-center justify-between rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
          {tv("openFull")}<ArrowUpRight className="size-4" aria-hidden />
        </button>
      </div>
    </StudioDialog>, document.body)}
    {ready && advanced && createPortal(<StudioDialog full trigger={trigger} onClose={() => setAdvanced(false)}>
      <EditorBoundary errorLabel={tv("loadError")} retryLabel={tv("reload")}><StudioEditor identity={identity} /></EditorBoundary>
    </StudioDialog>, document.body)}
  </>;
}
