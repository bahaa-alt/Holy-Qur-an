"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getMeta, getVerses } from "@/lib/data/loader";
import { AyahCard } from "@/components/ayah/AyahCard";
import { Pagination } from "@/components/ayah/Pagination";
import { CopyTextButton } from "@/components/export/CopyTextButton";
import { useT } from "@/lib/i18n/LanguageContext";
import type { MetaFile, SurahVerse } from "@/lib/data/types";
import type { TopicVerseMatch } from "@/lib/topics/buildTopicOccurrences";

const PAGE_SIZE = 25;
const EMPTY_VERSE_MAP = new Map<string, SurahVerse>();

interface ResultRow {
  s: number;
  a: number;
  tokens: string[];
  translation: string;
  pickthall?: string;
  words: number[];
}

function buildMarkdown(results: readonly { s: number; a: number; translation: string }[]): string {
  return results.map((r) => `- [${r.s}:${r.a}](/surah/${r.s}/?ayah=${r.a}) -- ${r.translation}`).join("\n");
}

/**
 * Paginated, verse-card rendering of a topic's already-resolved matches
 * (built server-side at build time by TopicPage, since a topic can pull
 * from several roots/lemma files at once -- unlike AyahExplorer, which is
 * scoped to exactly one root/lemma's own file). This component only
 * resolves verse text/translation client-side, the same way PhraseSearch
 * and the /search/ page do.
 */
export function TopicVerseList({ matches }: { matches: readonly TopicVerseMatch[] }) {
  const t = useT();
  const [meta, setMeta] = useState<MetaFile | null>(null);
  const [page, setPage] = useState(1);
  const [pageVerses, setPageVerses] = useState<Map<string, SurahVerse>>(EMPTY_VERSE_MAP);

  useEffect(() => {
    getMeta().then(setMeta);
  }, []);

  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const currentPageMatches = useMemo(
    () => matches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [matches, currentPage],
  );

  // Nothing to reset when the page is empty: `pageRows` below is derived
  // straight from `currentPageMatches` and `pageVerses`, not tracked as its
  // own state, so there's no stale value to clear.
  useEffect(() => {
    if (currentPageMatches.length === 0) return;
    let cancelled = false;
    getVerses(currentPageMatches.map((m) => ({ s: m.s, a: m.a }))).then((verseMap) => {
      if (!cancelled) setPageVerses(verseMap);
    });
    return () => {
      cancelled = true;
    };
  }, [currentPageMatches]);

  const displayedPageVerses = currentPageMatches.length === 0 ? EMPTY_VERSE_MAP : pageVerses;
  const pageRows: ResultRow[] = currentPageMatches
    .map((m): ResultRow | null => {
      const verse = displayedPageVerses.get(`${m.s}:${m.a}`);
      if (!verse) return null;
      return {
        s: m.s,
        a: m.a,
        tokens: verse.w,
        translation: verse.t,
        pickthall: verse.pickthall,
        words: m.words,
      };
    })
    .filter((r): r is ResultRow => r !== null);
  const isLoadingVerses = currentPageMatches.length > 0 && pageRows.length < currentPageMatches.length;

  if (matches.length === 0) {
    return <p className="text-sm text-muted">{t.topicVerseList.noMatches}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {pageRows.length > 0 && <CopyTextButton text={buildMarkdown(pageRows)} label={t.topicVerseList.copyThisPage} />}
      </div>
      {isLoadingVerses ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" /> {t.common.loadingVerses}
        </div>
      ) : (
        pageRows.map((row) => {
          const surahMeta = meta?.surahs.find((s) => s.n === row.s);
          if (!surahMeta) return null;
          return (
            <AyahCard
              key={`${row.s}-${row.a}`}
              surahMeta={surahMeta}
              ayah={row.a}
              tokens={row.tokens}
              translation={row.translation}
              pickthall={row.pickthall}
              highlightIndices={row.words}
              emphasisIndex={row.words[0]}
            />
          );
        })
      )}
      <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
