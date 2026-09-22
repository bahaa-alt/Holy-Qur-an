"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";

type Theme = "light" | "dark";

export function ThemeToggle() {
  // Must start identical to the prerendered HTML, which is always "light".
  // This used to read the class the no-flash script sets in a lazy
  // initializer, so a stored dark preference made the client's first render
  // (Sun) diverge from the server's (Moon) -- a hydration mismatch that made
  // React client-render the whole root, and rebuilding <html> wiped the very
  // `.dark` class that script had just applied. A saved dark theme never
  // survived a page load. The icon is picked by CSS off that class instead,
  // so it is right from first paint; state only drives the label and click.
  const [theme, setTheme] = useState<Theme>("light");
  const t = useT();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the class the no-flash script set, not a subscription; see comment above.
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

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
      <Sun size={18} className="hidden dark:block" />
      <Moon size={18} className="block dark:hidden" />
    </button>
  );
}
