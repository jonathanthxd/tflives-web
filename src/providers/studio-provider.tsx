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

type StudioContextValue = StudioPreferences & {
  ready: boolean;
  setAccent: (accent: StudioAccentId) => void;
  setFont: (font: StudioFontId) => void;
  setBackground: (background: StudioBackgroundId) => void;
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
  };
}

function applyPreferences(preferences: StudioPreferences) {
  const root = document.documentElement;
  root.dataset.tflAccent = preferences.accent;
  root.dataset.tflBackground = preferences.background;
  document.body.dataset.tflFont = preferences.font;
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<StudioPreferences>(
    DEFAULT_STUDIO_PREFERENCES,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = DEFAULT_STUDIO_PREFERENCES;

    try {
      const stored = window.localStorage.getItem(STUDIO_STORAGE_KEY);
      if (stored) initial = sanitizePreferences(JSON.parse(stored));
    } catch {
      // A corrupted/localStorage-disabled preference should never block the site.
    }

    setPreferences(initial);
    applyPreferences(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyPreferences(preferences);

    try {
      window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Personalization stays functional for the current tab even without storage.
    }
  }, [preferences, ready]);

  const setAccent = useCallback((accent: StudioAccentId) => {
    setPreferences((current) => ({ ...current, accent }));
  }, []);

  const setFont = useCallback((font: StudioFontId) => {
    setPreferences((current) => ({ ...current, font }));
  }, []);

  const setBackground = useCallback((background: StudioBackgroundId) => {
    setPreferences((current) => ({ ...current, background }));
  }, []);

  const resetStudio = useCallback(() => {
    setPreferences(DEFAULT_STUDIO_PREFERENCES);
  }, []);

  const value = useMemo<StudioContextValue>(
    () => ({
      ...preferences,
      ready,
      setAccent,
      setFont,
      setBackground,
      resetStudio,
    }),
    [preferences, ready, setAccent, setBackground, setFont, resetStudio],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error("useStudio must be used inside StudioProvider");
  return context;
}
