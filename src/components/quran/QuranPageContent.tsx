"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { QuranIndexBrowser } from "./QuranIndexBrowser";
import type { SurahMeta } from "@/lib/data/types";

export function QuranPageContent({ surahs }: { surahs: SurahMeta[] }) {
  const t = useT();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">{t.quran.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.quran.subtitle}</p>
      <div className="mt-6">
        <QuranIndexBrowser surahs={surahs} />
      </div>
    </div>
  );
}
