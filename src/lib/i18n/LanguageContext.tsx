"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { en } from "./en";
import { ar } from "./ar";
import type { Dict } from "./types";

export type Lang = "en" | "ar";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** The current language's translation dictionary. */
  t: Dict;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Starts at "en" to match the prerendered static HTML (every page is
  // built once, in English -- there's no server to answer a per-request
  // language). Unlike ThemeToggle's lazy-initializer trick (safe there
  // because only one small icon is affected), reading localStorage's
  // stored language into the *first* client render would make nearly
  // every piece of text on the page diverge from the server-rendered
  // markup at once -- confirmed with a real browser: a page-wide React
  // error #418, not just a warning. So this corrects itself in a
  // post-mount effect instead, same as CompareView's URL-restore and
  // SaveButton's saved-state: a brief English flash for returning Arabic
  // users, but never a hydration mismatch.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("uiLang");
    } catch {
      // localStorage unavailable -- stay on the "en" default
    }
    if (stored === "ar") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage, not a subscription; see comment above.
      setLangState("ar");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  function setLang(next: Lang) {
    setLangState(next);
    try {
      localStorage.setItem("uiLang", next);
    } catch {
      // localStorage unavailable (private browsing, blocked storage) -- ignore
    }
  }

  const value: LanguageContextValue = { lang, setLang, t: lang === "ar" ? ar : en };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** The full translation dictionary for the current UI language. */
export function useT(): Dict {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT() must be used within <LanguageProvider>");
  return ctx.t;
}

/** Current language + setter, for the toggle itself and any `lang`/`dir`-dependent styling. */
export function useLanguage(): Omit<LanguageContextValue, "t"> {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage() must be used within <LanguageProvider>");
  return { lang: ctx.lang, setLang: ctx.setLang };
}
