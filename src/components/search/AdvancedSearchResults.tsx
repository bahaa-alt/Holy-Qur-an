"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getVerses } from "@/lib/data/loader";
import { KwicRow } from "@/components/ayah/KwicRow";
import { ROMAN_FORMS } from "@/lib/morphology/classify";
import { rootHref, wordHref } from "@/lib/search/suggest";
import { useT } from "@/lib/i18n/LanguageContext";
import type { AdvancedSearchRow } from "@/lib/search/advancedSearch";
import type { IndexFile, MetaFile, SurahVerse } from "@/lib/data/types";

/**
 * Renders one page of advanced-search results. Takes its rows once at
 * mount (captured into state so the fetch effect below has a stable
 * dependency) -- the parent gives this component a fresh `key` whenever
 * the filters or page change, so a new instance (and a new fetch) is
 * exactly what "the rows changed" means here, same pattern as
 * WordInfoPanel/AyahMorphologyTable.
 */
export function AdvancedSearchResults({
  rows,
  index,
  meta,
}: {
  rows: AdvancedSearchRow[];
  index: IndexFile;
  meta: MetaFile;
}) {
  const t = useT();
  const [initialRows] = useState(rows);
  const [verses, setVerses] = useState<Map<string, SurahVerse> | null>(null);
  const surahByNum = new Map(meta.surahs.map((sm) => [sm.n, sm]));

  useEffect(() => {
    let cancelled = false;
    getVerses(initialRows.map((r) => ({ s: r.s, a: r.a }))).then((v) => {
      if (!cancelled) setVerses(v);
    });
    return () => {
      cancelled = true;
    };
  }, [initialRows]);

  if (verses === null) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Loader2 size={14} className="animate-spin" /> {t.advancedSearchPage.loading}
      </p>
    );
  }

  return (
    <div className="divide-y divide-border/60 rounded-xl border border-border bg-surface px-4">
      {initialRows.map((row, i) => {
        const verse = verses.get(`${row.s}:${row.a}`);
        const rootRow = index.roots[row.rootIdx];
        const surahMeta = surahByNum.get(row.s);

        return (
          <div key={i} className="py-2">
            {verse && surahMeta ? (
              <KwicRow surahMeta={surahMeta} ayah={row.a} tokens={verse.w} wordIndex={row.w} />
            ) : (
              <p className="text-xs text-muted">
                {row.s}:{row.a}
              </p>
            )}
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 ps-16 text-xs text-muted">
              <Link href={rootHref(rootRow.ar)} className="arabic-ui text-accent hover:text-accent-strong">
                {rootRow.ar}
              </Link>
              <Link href={wordHref(row.lemmaIdx)} className="text-accent hover:text-accent-strong">
                {index.lemmas[row.lemmaIdx]?.lemma}
              </Link>
              <span>{t.categories[row.cat]}</span>
              {row.verbForm > 0 && ROMAN_FORMS[String(row.verbForm)] && (
                <span>{t.advancedSearchPage.verbFormShort(ROMAN_FORMS[String(row.verbForm)])}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
