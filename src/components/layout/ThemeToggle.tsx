"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle() {
  // Reads the class the no-flash inline script already applied before hydration,
  // so this never has to "flip" on mount.
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const t = useT();

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage unavailable (private browsing, blocked storage) -- ignore
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? t.themeToggle.switchToLight : t.themeToggle.switchToDark}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
