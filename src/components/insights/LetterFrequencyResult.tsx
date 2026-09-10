"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getSurah } from "@/lib/data/loader";
import { countLetters, type LetterCount } from "@/lib/arabic/letterFrequency";
import { filterVersesInJuz, juzSurahNumbers } from "@/lib/quran/juz";
import { LetterFrequencyTable } from "./LetterFrequencyTable";
import { useT } from "@/lib/i18n/LanguageContext";
import type { SurahFile } from "@/lib/data/types";

type Scope = "ayah" | "surah" | "juz";

/**
 * Fetches whatever's needed for one letter-frequency selection and counts
 * it. The parent gives this a fresh `key` per distinct (scope, surah,
 * ayah, juz) combination, so a new instance -- and a new fetch -- is
 * exactly what "the selection changed" means here (same pattern as
 * WordInfoPanel/AyahMorphologyTable/AdvancedSearchResults). Props are
 * captured into state once so the mount effect has a stable dependency.
 */
export function LetterFrequencyResult({
  scope,
  surahNum,
  ayahNum,
  juzNum,
}: {
  scope: Scope;
  surahNum: number;
  ayahNum: number;
  juzNum: number;
}) {
  const t = useT();
  const [selection] = useState({ scope, surahNum, ayahNum, juzNum });
  const [rows, setRows] = useState<LetterCount[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let tokens: string[];

      if (selection.scope === "ayah") {
        const surah = await getSurah(selection.surahNum);
        const verse = surah.verses.find((v) => v.a === selection.ayahNum);
        tokens = verse ? verse.w : [];
      } else if (selection.scope === "surah") {
        const surah = await getSurah(selection.surahNum);
        tokens = surah.verses.flatMap((v) => v.w);
      } else {
        const surahNums = juzSurahNumbers(selection.juzNum);
        const surahs = await Promise.all(surahNums.map((n) => getSurah(n)));
        const surahsByNum = new Map<number, SurahFile>(surahs.map((s) => [s.n, s]));
        tokens = filterVersesInJuz(selection.juzNum, surahsByNum).flatMap((v) => v.w);
      }

      if (!cancelled) setRows(countLetters(tokens));
    })();

    return () => {
      cancelled = true;
    };
  }, [selection]);

  if (rows === null) {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm text-muted">
        <Loader2 size={14} className="animate-spin" /> {t.insightsPage.loading}
      </p>
    );
  }

  return <LetterFrequencyTable rows={rows} />;
}
