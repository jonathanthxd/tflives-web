"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_STUDIO_PREFERENCES,
  STUDIO_STORAGE_KEY,
  isStudioAccent,
  isStudioBackground,
  isStudioFont,
  type StudioAccentId,
  type StudioBackgroundId,
  type StudioFontId,
  type StudioPreferences,
} from "@/shared/studio/config";
import {
  STUDIO_CURSOR_ROLES,
  getCursorAnimationInterval,
  getCursorCssValue,
  getStudioCursorPack,
  normalizeStudioCursor,
  type StudioCursorId,
} from "@/shared/studio/cursors";
import { useHydrated, useInitialClientValue } from "@/shared/lib/client-value";

type StudioContextValue = StudioPreferences & {
  ready: boolean;
  setAccent: (accent: StudioAccentId) => void;
  setFont: (font: StudioFontId) => void;
  setBackground: (background: StudioBackgroundId) => void;
  setCursor: (cursor: StudioCursorId) => void;
  resetStudio: () => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

function sanitizePreferences(value: unknown): StudioPreferences {
  if (!value || typeof value !== "object") return DEFAULT_STUDIO_PREFERENCES;

  const candidate = value as Partial<StudioPreferences>;
  return {
    accent: isStudioAccent(candidate.accent)
      ? candidate.accent
      : DEFAULT_STUDIO_PREFERENCES.accent,
    font: isStudioFont(candidate.font)
      ? candidate.font
      : DEFAULT_STUDIO_PREFERENCES.font,
    background: isStudioBackground(candidate.background)
      ? candidate.background
      : DEFAULT_STUDIO_PREFERENCES.background,
    cursor: normalizeStudioCursor(candidate.cursor),
  };
}

function applyPreferences(preferences: StudioPreferences) {
  const root = document.documentElement;
  root.dataset.tflAccent = preferences.accent;
  root.dataset.tflBackground = preferences.background;
  root.dataset.tflCursor = preferences.cursor;
  document.body.dataset.tflFont = preferences.font;
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const initial = useInitialClientValue(() => {
    let initial = DEFAULT_STUDIO_PREFERENCES;

    try {
      const stored = window.localStorage.getItem(STUDIO_STORAGE_KEY);
      if (stored) initial = sanitizePreferences(JSON.parse(stored));
    } catch {
      // A corrupted/localStorage-disabled preference should never block the site.
    }

    return initial;
  }, DEFAULT_STUDIO_PREFERENCES);
  const [selected, setSelected] = useState<StudioPreferences | null>(null);
  const preferences = selected ?? initial;
  const ready = useHydrated();

  useEffect(() => {
    if (!ready) return;
    applyPreferences(preferences);

    try {
      window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Personalization stays functional for the current tab even without storage.
    }
  }, [preferences, ready]);

  useEffect(() => {
    if (!ready) return;

    const root = document.documentElement;
    const pack = getStudioCursorPack(preferences.cursor);
    const variableNames = STUDIO_CURSOR_ROLES.map(
      (role) => `--tfl-cursor-${role}`,
    );

    const clearCursorVariables = () => {
      for (const variable of variableNames) root.style.removeProperty(variable);
    };

    if (pack.id === "system") {
      clearCursorVariables();
      return;
    }

    const preloadFrames = new Set(
      STUDIO_CURSOR_ROLES.flatMap((role) => pack.roles[role]?.frames ?? []),
    );
    for (const frame of preloadFrames) {
      const image = new Image();
      image.src = frame;
    }

    const animationInterval = getCursorAnimationInterval(pack);

    const startedAt = performance.now();
    const lastValues = new Map<string, string>();
    let timer: number | null = null;

    const paint = () => {
      const elapsed = performance.now() - startedAt;
      for (const role of STUDIO_CURSOR_ROLES) {
        const value = getCursorCssValue(pack, role, elapsed);
        if (lastValues.get(role) === value) continue;
        lastValues.set(role, value);
        root.style.setProperty(`--tfl-cursor-${role}`, value);
      }
    };

    const resume = () => {
      paint();
      if (!animationInterval || timer !== null || document.hidden) return;
      timer = window.setInterval(paint, animationInterval);
    };

    const pause = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };

    const onVisibilityChange = () => {
      if (document.hidden) pause();
      else resume();
    };

    resume();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      pause();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearCursorVariables();
    };
  }, [preferences.cursor, ready]);

  const setAccent = useCallback((accent: StudioAccentId) => {
    setSelected((current) => ({ ...(current ?? initial), accent }));
  }, [initial]);

  const setFont = useCallback((font: StudioFontId) => {
    setSelected((current) => ({ ...(current ?? initial), font }));
  }, [initial]);

  const setBackground = useCallback((background: StudioBackgroundId) => {
    setSelected((current) => ({ ...(current ?? initial), background }));
  }, [initial]);

  const setCursor = useCallback((cursor: StudioCursorId) => {
    setSelected((current) => ({ ...(current ?? initial), cursor }));
  }, [initial]);

  const resetStudio = useCallback(() => {
    setSelected(DEFAULT_STUDIO_PREFERENCES);
  }, []);

  const value = useMemo<StudioContextValue>(
    () => ({
      ...preferences,
      ready,
      setAccent,
      setFont,
      setBackground,
      setCursor,
      resetStudio,
    }),
    [preferences, ready, setAccent, setBackground, setCursor, setFont, resetStudio],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error("useStudio must be used inside StudioProvider");
  return context;
}
