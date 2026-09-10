"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface ReadingModeContextValue {
  interlinear: boolean;
  setInterlinear: (v: boolean) => void;
}

const ReadingModeContext = createContext<ReadingModeContextValue | null>(null);
const STORAGE_KEY = "qrr:interlinearMode";

/**
 * Whether the surah page shows the per-word interlinear gloss instead of
 * the plain verse text. Scoped to the surah page tree (narrower than the
 * app-wide LanguageContext), but persisted the same way -- via localStorage
 * so the preference survives navigating between surahs, not just within
 * one page.
 */
export function ReadingModeProvider({ children }: { children: ReactNode }) {
  // Starts false to match the prerendered static HTML (every page is built
  // once, with interlinear mode off) -- corrected in a post-mount effect,
  // same discipline as LanguageProvider: reading localStorage into the
  // *first* client render would diverge from the server-rendered markup
  // and trip a hydration mismatch.
  const [interlinear, setInterlinearState] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable -- stay off
    }
    if (stored === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage, not a subscription; see comment above.
      setInterlinearState(true);
    }
  }, []);

  function setInterlinear(next: boolean) {
    setInterlinearState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // localStorage unavailable (private browsing, blocked storage) -- ignore
    }
  }

  return (
    <ReadingModeContext.Provider value={{ interlinear, setInterlinear }}>{children}</ReadingModeContext.Provider>
  );
}

export function useInterlinearMode(): [boolean, (v: boolean) => void] {
  const ctx = useContext(ReadingModeContext);
  if (!ctx) throw new Error("useInterlinearMode() must be used within <ReadingModeProvider>");
  return [ctx.interlinear, ctx.setInterlinear];
}
