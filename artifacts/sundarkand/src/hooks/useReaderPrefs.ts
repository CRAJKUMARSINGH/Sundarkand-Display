import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sundarkand-reader-prefs";

export type FontFamily = "standard" | "calligraphic";
export type ReadingTheme = "devotional" | "night" | "contrast";
export type FontSizeStep = 0.85 | 1 | 1.15 | 1.3 | 1.5;

const FONT_STEPS: FontSizeStep[] = [0.85, 1, 1.15, 1.3, 1.5];

export interface ReaderPrefs {
  fontSize: FontSizeStep;
  fontFamily: FontFamily;
  theme: ReadingTheme;
  lastDoha: number;
  lastScrollTop: number;
}

const DEFAULTS: ReaderPrefs = {
  fontSize: 1,
  fontFamily: "standard",
  theme: "devotional",
  lastDoha: 1,
  lastScrollTop: 0,
};

function loadPrefs(): ReaderPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ReaderPrefs>;
    return {
      fontSize: FONT_STEPS.includes(parsed.fontSize as FontSizeStep)
        ? (parsed.fontSize as FontSizeStep)
        : DEFAULTS.fontSize,
      fontFamily: parsed.fontFamily === "calligraphic" ? "calligraphic" : "standard",
      theme:
        parsed.theme === "night" || parsed.theme === "contrast"
          ? parsed.theme
          : "devotional",
      lastDoha: typeof parsed.lastDoha === "number" ? parsed.lastDoha : 1,
      lastScrollTop: typeof parsed.lastScrollTop === "number" ? parsed.lastScrollTop : 0,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function savePrefs(prefs: ReaderPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* quota / private browsing */
  }
}

export function useReaderPrefs() {
  const [prefs, setPrefs] = useState<ReaderPrefs>(loadPrefs);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const setFontSize = useCallback((size: FontSizeStep) => {
    setPrefs(p => ({ ...p, fontSize: size }));
  }, []);

  const stepFontSize = useCallback((delta: 1 | -1) => {
    setPrefs(p => {
      const idx = FONT_STEPS.indexOf(p.fontSize);
      const next = Math.max(0, Math.min(FONT_STEPS.length - 1, idx + delta));
      return { ...p, fontSize: FONT_STEPS[next] };
    });
  }, []);

  const toggleFontFamily = useCallback(() => {
    setPrefs(p => ({
      ...p,
      fontFamily: p.fontFamily === "standard" ? "calligraphic" : "standard",
    }));
  }, []);

  const cycleTheme = useCallback(() => {
    setPrefs(p => {
      const order: ReadingTheme[] = ["devotional", "night", "contrast"];
      const idx = order.indexOf(p.theme);
      return { ...p, theme: order[(idx + 1) % order.length] };
    });
  }, []);

  const saveBookmark = useCallback((doha: number, scrollTop: number) => {
    setPrefs(p => {
      if (p.lastDoha === doha && p.lastScrollTop === scrollTop) return p;
      return { ...p, lastDoha: doha, lastScrollTop: scrollTop };
    });
  }, []);

  const clearBookmark = useCallback(() => {
    setPrefs(p => ({ ...p, lastDoha: 1, lastScrollTop: 0 }));
  }, []);

  const hasBookmark = prefs.lastDoha > 1 || prefs.lastScrollTop > 100;

  return {
    prefs,
    hasBookmark,
    setFontSize,
    stepFontSize,
    toggleFontFamily,
    cycleTheme,
    saveBookmark,
    clearBookmark,
  };
}

export const TOTAL_DOHAS = 60;
