"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { lookupVerseWordInfos, type WordLookupResult } from "@/lib/word/lookupWordInfo";
import { buildInterlinearGloss } from "@/lib/word/formatInterlinearGloss";
import { rootHref, wordHref } from "@/lib/search/suggest";
import { useT } from "@/lib/i18n/LanguageContext";

/**
 * A denser alternative to HighlightedVerse's tap-to-inspect: every word's
 * root/lemma/category is shown stacked underneath it at once, reusing the
 * exact same lookupVerseWordInfos this app already ships for
 * AyahMorphologyTable (no new data or lookup logic -- just a different
 * layout for the same resolved info).
 */
export function InterlinearVerse({ s, a, tokens }: { s: number; a: number; tokens: string[] }) {
  const t = useT();
  const [rows, setRows] = useState<WordLookupResult[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    lookupVerseWordInfos(s, a, tokens.length).then((results) => {
      if (!cancelled) setRows(results);
    });
    return () => {
      cancelled = true;
    };
  }, [s, a, tokens.length]);

  if (rows === null) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Loader2 size={14} className="animate-spin" /> {t.ayahMorphologyTable.loading}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-3" dir="rtl">
      {tokens.map((token, i) => {
        const result = rows[i];
        const gloss = buildInterlinearGloss(result, result.status === "found" ? t.categories[result.info.cat] : "");
        return (
          <div key={i} className="flex flex-col items-center gap-0.5 text-center">
            <span className="arabic-ui text-lg text-ink">{token}</span>
            {result.status === "found" ? (
              <>
                <Link
                  href={rootHref(result.info.rootAr)}
                  className="arabic-ui text-xs text-accent hover:text-accent-strong"
                >
                  {gloss.root}
                </Link>
                <Link
                  href={wordHref(result.info.globalLemmaIdx)}
                  className="arabic-ui text-[11px] text-muted hover:text-accent"
                >
                  {gloss.lemma}
                </Link>
                <span className="text-[10px] text-muted/70">{gloss.cat}</span>
              </>
            ) : (
              <span className="text-[10px] text-muted/50">{t.ayahMorphologyTable.notRooted}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
