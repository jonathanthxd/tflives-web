"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, LockKeyhole, Moon, Palette, RotateCcw, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useStudio } from "@/providers/studio-provider";
import {
  STUDIO_ACCENTS,
  STUDIO_ANIMATED_BACKGROUNDS,
  STUDIO_FONTS,
  STUDIO_STATIC_BACKGROUNDS,
  isAnimatedStudioBackground,
  type StudioAnimatedBackgroundId,
  type StudioBackgroundId,
} from "@/shared/studio/config";
import { StudioBackground } from "@/shared/ui/studio/studio-background";

function AnimatedPreview({
  background,
  animate,
  locked,
}: {
  background: StudioAnimatedBackgroundId;
  animate: boolean;
  locked: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (locked) {
      setVisible(false);
      return;
    }

    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "80px 0px" },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [locked]);

  return (
    <div ref={rootRef} className="relative h-20 overflow-hidden bg-[#05010a]">
      {visible ? (
        <StudioBackground background={background} preview animate={animate} />
      ) : (
        <div
          className={`studio-preview-fallback studio-preview-fallback--${background} absolute inset-0`}
          aria-hidden="true"
        />
      )}
      {locked && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/50 backdrop-blur-[1px]">
          <span className="grid size-8 place-items-center rounded-full border border-white/15 bg-black/45 text-white/80 shadow-lg">
            <LockKeyhole className="size-3.5" aria-hidden="true" />
          </span>
        </div>
      )}
    </div>
  );
}

export default function StudioMenu({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("Studio");
  const { resolvedTheme, setTheme } = useTheme();
  const {
    accent,
    font,
    background,
    setAccent,
    setFont,
    setBackground,
    resetStudio,
  } = useStudio();
  const [open, setOpen] = useState(false);
  const [animatedPreview, setAnimatedPreview] = useState<StudioBackgroundId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const animatedLocked = resolvedTheme === "light";

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const chooseLightTheme = () => {
    setAnimatedPreview(null);
    if (isAnimatedStudioBackground(background)) setBackground("dot");
    setTheme("light");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("open")}
        title={t("open")}
        className={`grid min-h-11 min-w-11 place-items-center transition-[color,background-color,border-radius] duration-300 ${
          compact ? "rounded-full" : "rounded-xl"
        } ${
          open
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
        }`}
      >
        <Palette className="size-5" strokeWidth={1.7} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("title")}
          className="tfl-glass tfl-glass-strong absolute left-0 top-[calc(100%+0.75rem)] z-[80] flex max-h-[calc(100dvh-6rem)] w-[calc(100vw-1.5rem)] max-w-[28rem] flex-col overflow-hidden rounded-3xl border"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <Palette className="size-4 text-primary" aria-hidden="true" />
                <h2 className="font-display text-base font-semibold text-foreground">{t("title")}</h2>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid min-h-10 min-w-10 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={t("close")}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-5">
            <section aria-labelledby="studio-theme-title">
              <div className="mb-3 flex items-center justify-between">
                <h3 id="studio-theme-title" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("theme")}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/[0.45] p-1.5">
                <button
                  type="button"
                  onClick={chooseLightTheme}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                    resolvedTheme === "light"
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sun className="size-4" aria-hidden="true" />
                  {t("light")}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                    resolvedTheme === "dark"
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Moon className="size-4" aria-hidden="true" />
                  {t("dark")}
                </button>
              </div>
            </section>

            <section className="mt-6" aria-labelledby="studio-color-title">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h3 id="studio-color-title" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("accent")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground/75">{t("accentHint")}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={t("accent")}>
                {STUDIO_ACCENTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={accent === item.id}
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => setAccent(item.id)}
                    className={`relative size-9 rounded-full border-2 transition-transform hover:scale-110 focus-visible:scale-110 ${
                      accent === item.id
                        ? "border-foreground shadow-[0_0_0_3px_hsl(var(--background)),0_0_0_5px_hsl(var(--foreground)/0.16)]"
                        : "border-background shadow-[0_0_0_1px_hsl(var(--border))]"
                    }`}
                    style={{ backgroundColor: item.color }}
                  />
                ))}
              </div>
            </section>

            <section className="mt-6" aria-labelledby="studio-background-title">
              <div className="mb-3">
                <h3 id="studio-background-title" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("backgrounds")}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/75">{t("backgroundHint")}</p>
              </div>

              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                {t("static")}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {STUDIO_STATIC_BACKGROUNDS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBackground(item.id)}
                    className={`group overflow-hidden rounded-2xl border text-left transition ${
                      background === item.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                    aria-pressed={background === item.id}
                  >
                    <div className="relative h-20 overflow-hidden bg-background">
                      <StudioBackground background={item.id} preview />
                    </div>
                    <div className="flex items-center justify-between bg-card/90 px-3 py-2">
                      <span className="text-xs font-medium text-foreground">{t(`backgroundNames.${item.labelKey}`)}</span>
                      {background === item.id && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mb-2 mt-4 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                  {t("animated")}
                </p>
                <span className={`inline-flex items-center gap-1 text-[10px] ${animatedLocked ? "text-amber-500" : "text-muted-foreground/60"}`}>
                  {animatedLocked && <LockKeyhole className="size-3" aria-hidden="true" />}
                  {animatedLocked ? t("darkOnly") : t("hoverPreview")}
                </span>
              </div>
              {animatedLocked && (
                <p className="mb-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-[11px] leading-4 text-muted-foreground">
                  {t("darkOnlyHint")}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {STUDIO_ANIMATED_BACKGROUNDS.map((item) => {
                  const previewIsActive = !animatedLocked && animatedPreview === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={animatedLocked}
                      onClick={() => setBackground(item.id)}
                      onMouseEnter={() => !animatedLocked && setAnimatedPreview(item.id)}
                      onMouseLeave={() => setAnimatedPreview((current) => (current === item.id ? null : current))}
                      onFocus={() => !animatedLocked && setAnimatedPreview(item.id)}
                      onBlur={() => setAnimatedPreview((current) => (current === item.id ? null : current))}
                      className={`group overflow-hidden rounded-2xl border text-left transition ${
                        animatedLocked
                          ? "cursor-not-allowed border-border/60 opacity-65"
                          : background === item.id
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/40"
                      }`}
                      aria-pressed={!animatedLocked && background === item.id}
                      title={animatedLocked ? t("darkOnlyHint") : item.label}
                    >
                      <AnimatedPreview background={item.id} animate={previewIsActive} locked={animatedLocked} />
                      <div className="flex items-center justify-between bg-card/90 px-3 py-2">
                        <span className="text-xs font-medium text-foreground">{item.label}</span>
                        {animatedLocked ? (
                          <LockKeyhole className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
                        ) : background === item.id ? (
                          <Check className="size-3.5 text-primary" aria-hidden="true" />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-6" aria-labelledby="studio-font-title">
              <div className="mb-3">
                <h3 id="studio-font-title" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("font")}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/75">{t("fontHint")}</p>
              </div>
              <div className="space-y-2">
                {STUDIO_FONTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFont(item.id)}
                    aria-pressed={font === item.id}
                    className={`flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border px-3.5 py-2.5 text-left transition ${
                      font === item.id
                        ? "border-primary bg-primary/[0.07] ring-1 ring-primary/[0.15]"
                        : "border-border bg-card/[0.55] hover:border-primary/[0.35] hover:bg-primary/5"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{t(`fontDescriptions.${item.descriptionKey}`)}</span>
                    </span>
                    <span
                      className="shrink-0 text-lg text-foreground"
                      style={{ fontFamily: item.cssVar, fontSizeAdjust: item.sizeAdjust ?? "none" }}
                      aria-hidden="true"
                    >
                      TFLives
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="border-t border-border/70 bg-card/60 px-5 py-3">
            <button
              type="button"
              onClick={() => {
                resetStudio();
                setTheme("dark");
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t("reset")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
