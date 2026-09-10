"use client";

import { Languages } from "lucide-react";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const t = useT();

  return (
    <button
      type="button"
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      aria-label={lang === "ar" ? t.languageToggle.switchToEnglish : t.languageToggle.switchToArabic}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <Languages size={16} />
      {lang === "ar" ? "EN" : "AR"}
    </button>
  );
}
