"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Check, Moon, Sun } from "lucide-react";
import { useStudio } from "@/providers/studio-provider";
import { STUDIO_ACCENTS, STUDIO_STATIC_BACKGROUNDS, STUDIO_ANIMATED_BACKGROUNDS, isAnimatedStudioBackground, type StudioBackgroundId } from "@/shared/studio/config";

export function ThemeControl() {
  const t = useTranslations("Studio");
  const { resolvedTheme, setTheme } = useTheme();
  const studio = useStudio();
  const { background, replacePreferences } = studio;
  const choose = (theme: "light" | "dark") => {
    replacePreferences({ ...studio, background: theme === "light" && isAnimatedStudioBackground(background) ? "dot" : background, presetId: null });
    setTheme(theme);
  };
  return <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/40 p-1">
    {(["light", "dark"] as const).map((theme) => <button type="button" key={theme} onClick={() => choose(theme)} aria-pressed={resolvedTheme === theme}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${resolvedTheme === theme ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"}`}>
      {theme === "light" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}{t(theme)}
    </button>)}
  </div>;
}
export function AccentControl({ names = false }: { names?: boolean }) {
  const t = useTranslations("StudioV2");
  const { accent, setAccent } = useStudio();
  return <div className={names ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-1"}>
    {STUDIO_ACCENTS.map((item) => <button type="button" key={item.id} onClick={() => setAccent(item.id)} aria-pressed={accent === item.id} aria-label={t(`accents.${item.id}`)} title={t(`accents.${item.id}`)}
      className={names ? `flex min-h-11 items-center gap-2 rounded-xl border px-2 text-left text-xs ${accent === item.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"}` : "grid size-11 place-items-center rounded-xl hover:bg-muted/50"}>
      <span className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${accent === item.id ? "border-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : "border-background shadow-sm"}`} style={{ background: item.color }}>
        {accent === item.id && <Check className="size-3.5 text-white [filter:drop-shadow(0_1px_1px_black)]" aria-hidden />}
      </span>
      {names && <span className="min-w-0 truncate">{t(`accents.${item.id}`)}</span>}
    </button>)}
  </div>;
}
export function BackgroundSelect() {
  const t = useTranslations("Studio");
  const { resolvedTheme } = useTheme();
  const { background, setBackground } = useStudio();
  return <select aria-label={t("backgrounds")} value={background} onChange={(event) => setBackground(event.target.value as StudioBackgroundId)}
    className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground">
    <optgroup label={t("static")}>{STUDIO_STATIC_BACKGROUNDS.map((item) => <option key={item.id} value={item.id}>{t(`backgroundNames.${item.id}`)}</option>)}</optgroup>
    <optgroup label={t("animated")}>{STUDIO_ANIMATED_BACKGROUNDS.map((item) => <option key={item.id} value={item.id} disabled={resolvedTheme === "light"}>{item.label}</option>)}</optgroup>
  </select>;
}
