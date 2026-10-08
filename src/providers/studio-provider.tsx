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
  type StudioCursorId,
} from "@/shared/studio/cursors";
import { useHydrated, useInitialClientValue } from "@/shared/lib/client-value";
import { observeCosmeticVisibility } from "@/modules/cosmetics/visibility";
import { COMPOSITION_CONTROLS, backgroundControls, boundedNumber, type CompositionKey } from "@/shared/studio/appearance";
import { DEFAULT_STUDIO_STORAGE, readStudioStorage, persistStudioStorage, sanitizePreferences, sanitizeStudioStorage, type StudioStorage, type UserAppearancePreset } from "@/shared/studio/storage";

type StudioContextValue = StudioPreferences & {
  ready: boolean;
  setAccent: (accent: StudioAccentId) => void;
  setFont: (font: StudioFontId) => void;
  setBackground: (background: StudioBackgroundId) => void;
  setCursor: (cursor: StudioCursorId) => void;
  resetStudio: () => void;
  setComposition: (key: CompositionKey, value: number) => void;
  setBackgroundOption: (key: string, value: number) => void;
  replacePreferences: (value: StudioPreferences) => void;
  presets: UserAppearancePreset[];
  setPresets: (presets: UserAppearancePreset[]) => void;
  storageAvailable: boolean | null;
  editorOpen: boolean;
  setEditorOpen: (value: boolean) => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

function applyPreferences(preferences: StudioPreferences) {
  const root = document.documentElement;
  root.dataset.tflAccent = preferences.accent;
  root.dataset.tflBackground = preferences.background;
  root.dataset.tflCursor = preferences.cursor;
  document.body.dataset.tflFont = preferences.font;
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const initial = useInitialClientValue(() => {
    try {
      return readStudioStorage(window.localStorage);
    } catch {
      // A corrupted/localStorage-disabled preference should never block the site.
      return DEFAULT_STUDIO_STORAGE;
    }
  }, DEFAULT_STUDIO_STORAGE);
  const [selected, setSelected] = useState<StudioStorage | null>(null);
  const stored = selected ?? initial;
  const preferences = stored.preferences;
  const [storageAvailable, setStorageAvailable] = useState<boolean | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const ready = useHydrated();

  useEffect(() => observeCosmeticVisibility(), []);

  useEffect(() => {
    if (!ready) return;
    applyPreferences(preferences);

    let available = false;
    try { available = persistStudioStorage(window.localStorage, stored); } catch { /* Tab-only mode. */ }
    // Report the result of the external write, rather than claiming every edit saved.
    let active = true;
    queueMicrotask(() => { if (active) setStorageAvailable(available); });
    return () => { active = false; };
  }, [stored, preferences, ready]);

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

  const patchPreferences = useCallback((patch: Partial<StudioPreferences>) => {
    setSelected((current) => {
      const value = current ?? initial;
      return { ...value, preferences: { ...value.preferences, ...patch, presetId: null } };
    });
  }, [initial]);
  const setAccent = useCallback((accent: StudioAccentId) => patchPreferences({ accent }), [patchPreferences]);

  const setFont = useCallback((font: StudioFontId) => {
    patchPreferences({ font });
  }, [patchPreferences]);

  const setBackground = useCallback((background: StudioBackgroundId) => {
    patchPreferences({ background });
  }, [patchPreferences]);

  const setCursor = useCallback((cursor: StudioCursorId) => {
    patchPreferences({ cursor });
  }, [patchPreferences]);

  const replacePreferences = useCallback((value: StudioPreferences) => {
    setSelected((current) => ({ ...(current ?? initial), preferences: sanitizePreferences(value) }));
  }, [initial]);
  const setPresets = useCallback((presets: UserAppearancePreset[]) => {
    setSelected((current) => {
      const value = current ?? initial;
      return sanitizeStudioStorage({ ...value, presets }) ?? value;
    });
  }, [initial]);
  const setComposition = useCallback((key: CompositionKey, value: number) => {
    setSelected((current) => {
      const stored = current ?? initial;
      return { ...stored, preferences: { ...stored.preferences, presetId: null, composition: {
        ...stored.preferences.composition, [key]: boundedNumber(value, COMPOSITION_CONTROLS[key]),
      } } };
    });
  }, [initial]);
  const setBackgroundOption = useCallback((key: string, value: number) => {
    setSelected((current) => {
      const stored = current ?? initial;
      const background = stored.preferences.background;
      const definition = backgroundControls(background).find((item) => item.key === key);
      if (!definition) return stored;
      return { ...stored, preferences: { ...stored.preferences, presetId: null, backgroundSettings: {
        ...stored.preferences.backgroundSettings,
        [background]: { ...stored.preferences.backgroundSettings[background as keyof typeof stored.preferences.backgroundSettings], [key]: boundedNumber(value, definition) },
      } } };
    });
  }, [initial]);

  const resetStudio = useCallback(() => {
    replacePreferences(DEFAULT_STUDIO_PREFERENCES);
  }, [replacePreferences]);

  const value = useMemo<StudioContextValue>(
    () => ({
      ...preferences,
      ready,
      setAccent,
      setFont,
      setBackground,
      setCursor,
      resetStudio,
      setComposition, setBackgroundOption, replacePreferences,
      presets: stored.presets, setPresets, storageAvailable,
      editorOpen, setEditorOpen,
    }),
    [preferences, ready, setAccent, setBackground, setCursor, setFont, resetStudio, setComposition, setBackgroundOption, replacePreferences, stored.presets, setPresets, storageAvailable, editorOpen],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error("useStudio must be used inside StudioProvider");
  return context;
}
