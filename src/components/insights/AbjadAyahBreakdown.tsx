"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getSurah } from "@/lib/data/loader";
import { abjadValueOf } from "@/lib/arabic/abjad";
import { useT } from "@/lib/i18n/LanguageContext";

/**
 * Word-by-word Abjad breakdown of one verse, fetched fresh on mount. The
 * parent gives this a fresh `key` per (surah, ayah) selection, so a new
 * instance is exactly what "the selection changed" means here -- same
 * pattern as WordInfoPanel/AyahMorphologyTable/LetterFrequencyResult.
 */
export function AbjadAyahBreakdown({
  surahNum,
  ayahNum,
  onTotalClick,
}: {
  surahNum: number;
  ayahNum: number;
  onTotalClick: (value: number) => void;
}) {
  const t = useT();
  const [selection] = useState({ surahNum, ayahNum });
  const [words, setWords] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSurah(selection.surahNum).then((surah) => {
      const verse = surah.verses.find((v) => v.a === selection.ayahNum);
      if (!cancelled) setWords(verse ? verse.w : []);
    });
    return () => {
      cancelled = true;
    };
  }, [selection]);

  if (words === null) {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm text-muted">
        <Loader2 size={14} className="animate-spin" /> {t.insightsPage.abjadLoading}
      </p>
    );
  }

  const values = words.map((w) => ({ word: w, value: abjadValueOf(w) }));
  const total = values.reduce((sum, v) => sum + v.value, 0);

  return (
    <div className="mt-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted">{t.insightsPage.abjadWordBreakdownHeading}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((v, i) => (
          <div key={i} className="rounded-lg border border-border px-3 py-2 text-center">
            <div className="arabic-ui text-base text-ink">{v.word}</div>
            <div className="text-xs text-muted">{v.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink">
        <span className="text-xs uppercase tracking-wide text-muted">{t.insightsPage.abjadTotalLabel}: </span>
        <button type="button" onClick={() => onTotalClick(total)} className="text-lg font-semibold hover:text-accent">
          {total.toLocaleString()}
        </button>
      </p>
    </div>
  );
}
