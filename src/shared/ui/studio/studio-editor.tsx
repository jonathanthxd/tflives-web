"use client";

import "./studio-editor.css";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Bookmark, Check, ImageIcon, MousePointer2, Palette, Pause, Play, RotateCcw, Settings2, Shirt, Type, Undo2 } from "lucide-react";
import { useStudio } from "@/providers/studio-provider";
import { DEFAULT_STUDIO_PREFERENCES, STUDIO_ANIMATED_BACKGROUNDS, STUDIO_FONTS, STUDIO_STATIC_BACKGROUNDS, isAnimatedStudioBackground } from "@/shared/studio/config";
import { STUDIO_CURSOR_PACKS } from "@/shared/studio/cursors";
import { COMPOSITION_CONTROLS, DEFAULT_COMPOSITION, backgroundControls, backgroundValues, type CompositionKey, type BackgroundControl } from "@/shared/studio/appearance";
import { APPEARANCE_PRESETS, type AppearancePreset } from "@/shared/studio/presets";
import { MAX_USER_PRESETS, presetName, sanitizePreferences, type UserAppearancePreset, type StudioTheme } from "@/shared/studio/storage";
import { STUDIO_CATEGORIES, type StudioCategory } from "@/shared/studio/categories";
import { UserAvatar } from "@/modules/profiles/components/user-identity";
import { identityName } from "@/modules/profiles/types";
import { Link } from "@/i18n/navigation";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { AccentControl, ThemeControl } from "./studio-controls";
import { StudioBackground } from "./studio-background";
import { CursorPackPreview } from "./cursor-pack-preview";
import type { StudioIdentity } from "./studio-menu";

const CosmeticsPanel = dynamic(() => import("./studio-cosmetics-panel"));
const CATEGORY_ICONS = { general: Settings2, colors: Palette, backgrounds: ImageIcon, typography: Type, cursors: MousePointer2, cosmetics: Shirt, presets: Bookmark };

function Slider({ control, value, label, onChange }: { control: BackgroundControl; value: number; label: string; onChange: (value: number) => void }) {
  const t = useTranslations("StudioV2");
  const id = useId();
  return <div data-studio-control={control.key}>
    <div className="flex items-center justify-between gap-2"><label htmlFor={id} className="text-xs font-medium">{label}</label>
      <div className="flex items-center gap-1"><output htmlFor={id} className="rounded-md bg-muted/60 px-1.5 py-1 font-mono text-[11px] text-muted-foreground">{Number(value.toFixed(2))}{control.unit ?? ""}</output>
        <button type="button" onClick={() => onChange(control.default)} aria-label={t("resetSetting", { name: label })} className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><RotateCcw className="size-3" aria-hidden /></button>
      </div>
    </div>
    {control.type === "toggle" ? <label className="flex min-h-11 items-center gap-3 text-xs"><input id={id} type="checkbox" className="size-5 accent-primary" checked={value >= 0.5} onChange={(event) => onChange(event.target.checked ? 1 : 0)} />{value >= 0.5 ? t("enabled") : t("disabled")}</label> : <input id={id} type="range" className="studio-editor__range" min={control.min} max={control.max} step={control.step} value={value} onChange={(event) => onChange(Number(event.target.value))} aria-valuetext={`${value}${control.unit ?? ""}`} />}
  </div>;
}

function PresetsPanel() {
  const t = useTranslations("StudioV2");
  const studio = useStudio();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<UserAppearancePreset | null>(null);
  const nameId = useId();
  const apply = (preset: AppearancePreset | UserAppearancePreset) => { setTheme(preset.theme); studio.replacePreferences({ ...preset.preferences, presetId: preset.id }); };
  const save = () => {
    const validated = presetName(name);
    if (!validated) { setError(t("invalidName")); return; }
    if (!editing && studio.presets.length >= MAX_USER_PRESETS) { setError(t("presetLimit", { count: MAX_USER_PRESETS })); return; }
    if (editing) studio.setPresets(studio.presets.map((preset) => preset.id === editing ? { ...preset, name: validated } : preset));
    else studio.setPresets([...studio.presets, { id: `user-${crypto.randomUUID()}`, name: validated, theme: (theme ?? "dark") as StudioTheme, preferences: sanitizePreferences(studio) }]);
    setName(""); setEditing(null); setError("");
  };
  return <div className="space-y-6">
    <section><h4 className="mb-3 text-xs font-semibold text-muted-foreground">{t("includedPresets")}</h4><div className="studio-editor__gallery">
      {APPEARANCE_PRESETS.map((preset) => <button type="button" key={preset.id} className="studio-editor__tile" onClick={() => apply(preset)} aria-pressed={studio.presetId === preset.id} data-appearance-preset={preset.id}>
        <div className={`studio-preview-fallback studio-preview-fallback--${preset.preferences.background} studio-editor__poster`} />
        <span className="flex min-h-11 items-center justify-between gap-1 bg-card px-3 text-xs font-semibold">{preset.name}{studio.presetId === preset.id && <Check className="size-3" aria-hidden />}</span>
      </button>)}
    </div></section>
    <section><h4 className="mb-3 text-xs font-semibold text-muted-foreground">{t("personalPresets")}</h4>
      <form onSubmit={(event) => { event.preventDefault(); save(); }} className="space-y-2">
        <label className="block text-xs" htmlFor={nameId}>{t("presetName")}</label>
        <Input id={nameId} value={name} maxLength={40} onChange={(event) => setName(event.target.value)} placeholder={t("presetNameHint")} aria-invalid={Boolean(error)} />
        <p className="text-[11px] text-muted-foreground">{t("presetLimit", { count: MAX_USER_PRESETS })}</p>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={!editing && studio.presets.length >= MAX_USER_PRESETS}>{editing ? t("rename") : t("savePreset")}</Button>
        {editing && <Button type="button" variant="ghost" size="sm" onClick={() => { setEditing(null); setName(""); }}>{t("cancel")}</Button>}
      </form>
      <div className="mt-4 space-y-3">{studio.presets.map((preset) => <div key={preset.id} className="rounded-xl border border-border p-3" data-user-preset={preset.id}>
        <p className="break-words text-sm font-semibold">{preset.name}</p><div className="mt-2 flex flex-wrap gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => apply(preset)}>{t("apply")}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setEditing(preset.id); setName(preset.name); setError(""); }}>{t("rename")}</Button>
          <Button type="button" variant="destructive" size="sm" onClick={() => setDeleting(preset)}>{t("delete")}</Button>
        </div>
      </div>)}{!studio.presets.length && <p className="text-xs leading-5 text-muted-foreground">{t("noPresets")}</p>}</div>
    </section>
    <ConfirmDialog open={Boolean(deleting)} title={t("deletePreset")} description={t("deletePresetHint", { name: deleting?.name ?? "" })} confirmLabel={t("delete")} cancelLabel={t("cancel")}
      onCancel={() => setDeleting(null)} onConfirm={() => { studio.setPresets(studio.presets.filter((preset) => preset.id !== deleting?.id)); setDeleting(null); }} />
  </div>;
}

export default function StudioEditor({ identity }: { identity?: StudioIdentity }) {
  const t = useTranslations("StudioV2");
  const ts = useTranslations("Studio");
  const studio = useStudio();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [category, setCategory] = useState<StudioCategory>("general");
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const [samplePressed, setSamplePressed] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [snapshot] = useState(() => ({ preferences: sanitizePreferences(studio), theme: theme ?? "dark" }));
  const { setEditorOpen } = studio;
  useEffect(() => { setEditorOpen(true); return () => setEditorOpen(false); }, [setEditorOpen]);
  useEffect(() => { inspectorRef.current?.scrollTo({ top: 0 }); }, [category]);
  useEffect(() => {
    let onScreen = true;
    const update = () => setVisible(onScreen && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; update(); });
    if (previewRef.current) observer.observe(previewRef.current);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  const selectedPreset = [...APPEARANCE_PRESETS, ...studio.presets].find((preset) => preset.id === studio.presetId);
  const effectControls = backgroundControls(studio.background);
  const effectValues = backgroundValues(studio.background, studio.backgroundSettings);
  const locked = resolvedTheme === "light";
  const restoreCategory = () => {
    if (category === "general") { setTheme("dark"); studio.replacePreferences({ ...studio, presetId: null }); }
    if (category === "colors") studio.setAccent(DEFAULT_STUDIO_PREFERENCES.accent);
    if (category === "backgrounds") studio.replacePreferences({ ...studio, background: "dot", composition: DEFAULT_COMPOSITION, backgroundSettings: {}, presetId: null });
    if (category === "typography") studio.setFont("tfl");
    if (category === "cursors") studio.setCursor("system");
  };
  return <div className="studio-editor">
    <header className="studio-editor__header"><Image src="/icons/icon-192.png" alt="" width={32} height={32} unoptimized /><div className="min-w-0"><h2 className="font-display text-xl font-semibold sm:text-2xl">{t("title")}</h2><p className="mt-1 text-[11px] text-muted-foreground">{t("subtitle")}</p></div></header>
    <div className="studio-editor__body">
      <nav className="studio-editor__nav" aria-label={t("categoriesLabel")}>{STUDIO_CATEGORIES.map((item) => {
        const Icon = CATEGORY_ICONS[item];
        return <button type="button" key={item} className="studio-editor__category" aria-current={category === item ? "true" : undefined} data-studio-category={item} onClick={() => setCategory(item)}><Icon className="size-4 shrink-0" aria-hidden />{t(`categories.${item}`)}</button>;
      })}</nav>
      <section className="studio-editor__stage" aria-label={t("preview")}>
        <div className="mb-3 flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{t("preview")}</p><button type="button" className="grid size-11 place-items-center rounded-xl border border-border hover:bg-muted" onClick={() => setPaused((value) => !value)} aria-pressed={paused} aria-label={paused ? t("resumePreview") : t("pausePreview")}>{paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}</button></div>
        <div ref={previewRef} className="studio-editor__preview" data-studio-preview><StudioBackground background={studio.background} preview animate={!paused && visible} />
          <div className="studio-editor__sample">
            <div className="mb-4 flex items-center gap-3">{identity ? <UserAvatar identity={identity} className="size-12 text-lg" /> : <Image src="/icons/icon-192.png" alt="" width={44} height={44} unoptimized />}<div><span className="block font-display text-lg font-semibold">{identity ? identityName(identity) : "TFLives"}</span><span className="font-mono text-xs text-muted-foreground">{identity?.username ? `@${identity.username}` : t("sampleLabel")}</span></div></div>
            <h3 className="font-display text-2xl font-semibold leading-tight">{t("sampleTitle")}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{t("sampleDescription")}</p>
            <button type="button" className="mt-5 min-h-11 w-full rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground" aria-pressed={samplePressed} onClick={() => setSamplePressed((value) => !value)}>{samplePressed ? t("sampleActive") : t("sampleAction")}</button>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{t("previewHint")}</p>
      </section>
      <section ref={inspectorRef} className="studio-editor__inspector" aria-label={t(`categories.${category}`)}>
        <h3 className="font-display text-lg font-semibold">{t(`categories.${category}`)}</h3><p className="mb-5 mt-1 text-xs leading-5 text-muted-foreground">{t(`categoryHints.${category}`)}</p>
        {category === "general" && <div className="space-y-5"><ThemeControl /><dl className="space-y-3 rounded-xl border border-border bg-background/40 p-4 text-xs">
          <div><dt className="text-muted-foreground">{t("activePreset")}</dt><dd className="mt-1 font-semibold">{selectedPreset?.name ?? t("custom")}</dd></div>
          <div><dt className="text-muted-foreground">{ts("accent")}</dt><dd className="mt-1">{t(`accents.${studio.accent}`)}</dd></div>
          <div><dt className="text-muted-foreground">{ts("font")}</dt><dd className="mt-1">{STUDIO_FONTS.find((font) => font.id === studio.font)?.label}</dd></div>
        </dl><Button type="button" variant="outline" size="sm" onClick={() => setCategory("presets")}>{t("browsePresets")}</Button></div>}
        {category === "colors" && <AccentControl names />}
        {category === "backgrounds" && <div className="space-y-6">
          <div className="studio-editor__gallery">{STUDIO_STATIC_BACKGROUNDS.map((item) => <button type="button" key={item.id} onClick={() => studio.setBackground(item.id)} aria-pressed={studio.background === item.id} className="studio-editor__tile" data-studio-background={item.id}><div className={`studio-editor__poster studio-background--${item.id}`} /><span className="flex min-h-11 items-center px-3 text-xs font-medium">{ts(`backgroundNames.${item.id}`)}</span></button>)}</div>
          {locked && <p className="rounded-xl border border-border bg-muted/40 p-3 text-xs leading-5">{ts("darkOnlyHint")}</p>}
          <div className="studio-editor__gallery">{STUDIO_ANIMATED_BACKGROUNDS.map((item) => <button type="button" key={item.id} disabled={locked} onClick={() => studio.setBackground(item.id)} aria-pressed={studio.background === item.id} className="studio-editor__tile" data-studio-background={item.id}><div className={`studio-editor__poster studio-preview-fallback studio-preview-fallback--${item.id}`} /><span className="flex min-h-11 items-center px-3 text-xs font-medium">{item.label}</span></button>)}</div>
          <section className="space-y-3 border-t border-border pt-4"><h4 className="text-xs font-semibold text-muted-foreground">{t("composition")}</h4>{Object.entries(COMPOSITION_CONTROLS).map(([key, control]) => <Slider key={key} control={{ ...control, key }} value={studio.composition[key as CompositionKey]} label={t(`controls.${key}`)} onChange={(value) => studio.setComposition(key as CompositionKey, value)} />)}</section>
          {isAnimatedStudioBackground(studio.background) && <section className="space-y-3 border-t border-border pt-4"><h4 className="text-xs font-semibold text-muted-foreground">{t("effectSettings")}</h4>{effectControls.map((control) => <Slider key={control.key} control={control} value={effectValues[control.key]} label={t(`controls.${control.key}`)} onChange={(value) => studio.setBackgroundOption(control.key, value)} />)}</section>}
        </div>}
        {category === "typography" && <div className="space-y-2">{STUDIO_FONTS.map((font) => <button type="button" key={font.id} onClick={() => studio.setFont(font.id)} aria-pressed={studio.font === font.id} data-studio-font={font.id} className={`w-full rounded-xl border p-3 text-left ${studio.font === font.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"}`}><span className="flex items-center justify-between gap-2 text-xs font-semibold">{font.label}{studio.font === font.id && <Check className="size-3.5" aria-hidden />}</span><span className="mt-2 block min-h-9 text-xl" style={{ fontFamily: font.cssVar, fontSizeAdjust: font.sizeAdjust ?? "none" }}>{t("fontSample")}</span><span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{ts(`fontDescriptions.${font.id}`)}</span></button>)}</div>}
        {category === "cursors" && <div className="space-y-4"><div className="studio-editor__gallery">{STUDIO_CURSOR_PACKS.map((pack) => <button type="button" key={pack.id} onClick={() => studio.setCursor(pack.id)} aria-pressed={studio.cursor === pack.id} data-studio-cursor={pack.id} className="studio-editor__tile p-3"><MousePointer2 className="mb-2 size-5 text-primary" aria-hidden /><span className="block text-xs font-semibold">{pack.label}</span></button>)}</div><CursorPackPreview pack={STUDIO_CURSOR_PACKS.find((pack) => pack.id === studio.cursor)!} animatedLabel={ts("cursorAnimated")} roleLabels={{ default: ts("cursorPreview.default"), pointer: ts("cursorPreview.pointer"), text: ts("cursorPreview.text"), wait: ts("cursorPreview.wait") }} /><p className="text-xs leading-5 text-muted-foreground">{ts(`cursorDescriptions.${studio.cursor}`)}</p></div>}
        {category === "cosmetics" && <><CosmeticsPanel identity={identity} /><Link href="/cosmeticos" className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-xs font-semibold text-primary">{t("openInventory")}</Link></>}
        {category === "presets" && <PresetsPanel />}
        {category !== "presets" && category !== "cosmetics" && <Button type="button" variant="ghost" size="sm" className="mt-6" onClick={restoreCategory}><RotateCcw className="size-3.5" aria-hidden />{t("resetCategory")}</Button>}
      </section>
    </div>
    <footer className="studio-editor__footer"><p role="status" className="text-[11px] text-muted-foreground">{studio.storageAvailable === null ? t("checkingStorage") : studio.storageAvailable ? t("savedLocally") : t("tabOnly")}</p><div className="flex flex-wrap gap-1"><Button type="button" variant="ghost" size="sm" onClick={() => { studio.replacePreferences(snapshot.preferences); setTheme(snapshot.theme); }}><Undo2 className="size-3.5" aria-hidden />{t("revert")}</Button><Button type="button" variant="destructive" size="sm" onClick={() => setResetting(true)}>{t("resetAll")}</Button></div></footer>
    <ConfirmDialog open={resetting} title={t("resetAll")} description={t("resetAllHint")} confirmLabel={t("restore")} cancelLabel={t("cancel")} onCancel={() => setResetting(false)} onConfirm={() => { studio.resetStudio(); setTheme("dark"); setResetting(false); }} />
  </div>;
}
