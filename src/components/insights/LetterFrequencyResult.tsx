"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getSurah } from "@/lib/data/loader";
import { countLetters, type LetterCount } from "@/lib/arabic/letterFrequency";
import { letterFrequencyRefs } from "@/lib/insights/letterFrequencyScope";
import type { Scope } from "@/lib/insights/scope";
import { LetterFrequencyTable } from "./LetterFrequencyTable";
import { useT } from "@/lib/i18n/LanguageContext";
import type { MetaFile } from "@/lib/data/types";

/**
 * Fetches whatever's needed for one letter-frequency selection and counts
 * it. The parent gives this a fresh `key` per distinct (scope, ayahNum)
 * combination, so a new instance -- and a new fetch -- is exactly what
 * "the selection changed" means here (same pattern as
 * WordInfoPanel/AyahMorphologyTable/AdvancedSearchResults). Props are
 * captured into state once so the mount effect has a stable dependency.
 *
 * A juz', the Meccan/Medinan corpus or a revelation-order window can touch
 * anywhere from a couple of surahs to all 114, so this resolves the scope
 * to its verse refs first (the same inScope() every other scope-aware tool
 * uses), fetches only the surahs those refs actually touch, then keeps
 * just the in-scope verses out of each -- one code path for every scope
 * kind, including the single-ayah refinement (just a one-verse ref list).
 */
export function LetterFrequencyResult({
  meta,
  scope,
  ayahNum,
  onRows,
}: {
  meta: MetaFile;
  scope: Scope;
  /** narrows to this one ayah of `scope` (only meaningful when scope.kind === "surah") */
  ayahNum: number | null;
  onRows: (rows: LetterCount[]) => void;
}) {
  const t = useT();
  const [selection] = useState({ meta, scope, ayahNum });
  const [rows, setRows] = useState<LetterCount[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const refs = letterFrequencyRefs(selection.meta, selection.scope, selection.ayahNum);

      const surahNums = [...new Set(refs.map((r) => r.s))];
      const inScopeKeys = new Set(refs.map((r) => `${r.s}:${r.a}`));
      const surahs = await Promise.all(surahNums.map((n) => getSurah(n)));
      const tokens = surahs.flatMap((surah) =>
        surah.verses.filter((v) => inScopeKeys.has(`${surah.n}:${v.a}`)).flatMap((v) => v.w),
      );

      if (!cancelled) {
        const counted = countLetters(tokens);
        setRows(counted);
        onRows(counted);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `onRows` is the parent's setter, not state to react to independently.
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
