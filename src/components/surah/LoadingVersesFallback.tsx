"use client";

import { useT } from "@/lib/i18n/LanguageContext";

export function LoadingVersesFallback() {
  const t = useT();
  return <p className="text-center text-sm text-muted">{t.common.loadingVerses}</p>;
}
