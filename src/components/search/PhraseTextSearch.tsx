"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { getArIndex, getMeta, getVerses } from "@/lib/data/loader";
import { globalIdToRef } from "@/lib/data/verseId";
import { searchArabicPhrase, type PhraseMatch } from "@/lib/search/arabicPhrase";
import { AyahCard } from "@/components/ayah/AyahCard";
import { Pagination } from "@/components/ayah/Pagination";
import { CopyTextButton } from "@/components/export/CopyTextButton";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ArIndexFile, MetaFile, SurahVerse } from "@/lib/data/types";

const PAGE_SIZE = 25;
// Phrase queries built of common words (e.g. a single frequent particle)
// could in principle match thousands of verses; cap the working set the
// same way /phrases/ (root-adjacency search) does, so pagination and the
// export button never have to handle an unbounded result set.
const RESULT_CAP = 500;
const EMPTY_VERSE_MAP = new Map<string, SurahVerse>();

interface ResultRow {
  s: number;
  a: number;
  tokens: string[];
  translation: string;
  pickthall?: string;
  startW: number;
  endW: number;
}

function buildMarkdown(results: readonly { s: number; a: number; translation: string }[]): string {
  return results.map((r) => `- [${r.s}:${r.a}](/surah/${r.s}/?ayah=${r.a}) -- ${r.translation}`).join("\n");
}

export function PhraseTextSearch() {
  const t = useT();
  // Starts empty to match the prerendered static HTML -- a static-export
  // page has no server to answer differing query strings, so the real
  // initial query is read from the URL in the mount effect below, strictly
  // *after* hydration. Reads window.location.search directly (as
  // CompareView does) rather than useSearchParams(), which would force a
  // Suspense boundary for no benefit here.
  const [inputValue, setInputValue] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [arIndex, setArIndex] = useState<ArIndexFile | null>(null);
  const [meta, setMeta] = useState<MetaFile | null>(null);
  const [matches, setMatches] = useState<PhraseMatch[] | null>(null);
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageVerses, setPageVerses] = useState<Map<string, SurahVerse>>(EMPTY_VERSE_MAP);

  useEffect(() => {
    Promise.all([getArIndex(), getMeta()]).then(([ai, m]) => {
      setArIndex(ai);
      setMeta(m);
    });
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q && q.trim() !== "") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from the URL, not a subscription; see comment above.
      setInputValue(q);
    }
    setHydrated(true);
  }, []);

  function runSearch(query: string, ai: ArIndexFile) {
    const trimmed = query.trim();
    setSearchedQuery(trimmed);
    setPage(1);
    setMatches(trimmed === "" ? [] : searchArabicPhrase(trimmed, ai));
    const next = trimmed ? `${window.location.pathname}?q=${encodeURIComponent(trimmed)}` : window.location.pathname;
    window.history.replaceState(null, "", next);
  }

  // Auto-runs the search once (from a direct/shared link carrying ?q=), as
  // soon as both the URL has been read and ar-index.json has arrived.
  useEffect(() => {
    if (!hydrated || !arIndex || searchedQuery !== null) return;
    if (inputValue.trim() === "") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time run of a search restored from the URL, not a subscription; see comment above.
    runSearch(inputValue, arIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, arIndex]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!arIndex) return;
    runSearch(inputValue, arIndex);
  }

  const cappedMatches = useMemo(() => (matches ?? []).slice(0, RESULT_CAP), [matches]);
  const pageCount = Math.max(1, Math.ceil(cappedMatches.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const currentPageMatches = useMemo(
    () => cappedMatches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [cappedMatches, currentPage],
  );

  // Fetches only the current page's verses -- nothing to reset when the
  // page is empty (no matches yet, or the last match cleared), since
  // `pageRows` below is derived straight from `currentPageMatches` and
  // `pageVerses` rather than tracked as its own state.
  useEffect(() => {
    if (!meta || currentPageMatches.length === 0) return;
    let cancelled = false;
    const refs = currentPageMatches
      .map((m) => globalIdToRef(meta, m.globalId))
      .filter((r): r is { s: number; a: number } => r !== null);
    getVerses(refs).then((verseMap) => {
      if (!cancelled) setPageVerses(verseMap);
    });
    return () => {
      cancelled = true;
    };
  }, [meta, currentPageMatches]);

  const displayedPageVerses = currentPageMatches.length === 0 ? EMPTY_VERSE_MAP : pageVerses;
  const pageRows: ResultRow[] = meta
    ? currentPageMatches
        .map((m): ResultRow | null => {
          const ref = globalIdToRef(meta, m.globalId);
          if (!ref) return null;
          const verse = displayedPageVerses.get(`${ref.s}:${ref.a}`);
          if (!verse) return null;
          return {
            s: ref.s,
            a: ref.a,
            tokens: verse.w,
            translation: verse.t,
            pickthall: verse.pickthall,
            startW: m.startW,
            endW: m.endW,
          };
        })
        .filter((r): r is ResultRow => r !== null)
    : [];
  const isLoadingVerses = currentPageMatches.length > 0 && pageRows.length < currentPageMatches.length;

  const ready = arIndex !== null && meta !== null;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-6">
        <label htmlFor="phrase-query" className="mb-2 block text-sm font-medium text-ink">
          {t.phraseTextSearch.label}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="phrase-query"
            type="text"
            dir="rtl"
            lang="ar"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="يا أيها الناس"
            className="arabic-ui w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-lg text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={!ready || inputValue.trim() === ""}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-opacity disabled:opacity-50"
          >
            {!ready ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {t.phraseTextSearch.search}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">{t.phraseTextSearch.helperText}</p>
      </form>

      {searchedQuery !== null && searchedQuery !== "" && matches !== null && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {matches.length === 0
              ? t.phraseTextSearch.noResults(searchedQuery)
              : t.phraseTextSearch.matchCount(matches.length, RESULT_CAP)}
          </p>
          {pageRows.length > 0 && <CopyTextButton text={buildMarkdown(pageRows)} label={t.phraseTextSearch.copyThisPage} />}
        </div>
      )}

      <div className="space-y-3">
        {isLoadingVerses ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" /> {t.common.loadingVerses}
          </div>
        ) : (
          pageRows.map((row) => {
            const surahMeta = meta?.surahs.find((s) => s.n === row.s);
            if (!surahMeta) return null;
            const highlightIndices = Array.from({ length: row.endW - row.startW + 1 }, (_, i) => row.startW + i);
            return (
              <AyahCard
                key={`${row.s}-${row.a}-${row.startW}`}
                surahMeta={surahMeta}
                ayah={row.a}
                tokens={row.tokens}
                translation={row.translation}
                pickthall={row.pickthall}
                highlightIndices={highlightIndices}
                emphasisIndex={row.startW}
              />
            );
          })
        )}
      </div>

      <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
