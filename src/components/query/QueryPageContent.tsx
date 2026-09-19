"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { getIndex, getOccurrenceIndex, getSurah, getSyntaxIndex } from "@/lib/data/loader";
import { KwicRow } from "@/components/ayah/KwicRow";
import { Pagination } from "@/components/ayah/Pagination";
import { useT } from "@/lib/i18n/LanguageContext";
import { executeQcql, type QcqlCorpus, type QcqlResult } from "@/lib/qcql/execute";
import { parseQcql } from "@/lib/qcql/parse";
import { QcqlError } from "@/lib/qcql/types";
import type { SurahFile, SurahMeta } from "@/lib/data/types";

const PAGE_SIZE = 25;

/** The query in the URL, so every result set is a link someone can send. */
const QUERY_PARAM = "q";

interface Example {
  q: string;
  labelKey: keyof ReturnType<typeof useT>["queryPage"]["examples"];
}

const EXAMPLES: Example[] = [
  { q: "[root=علم & cat=verb.perf]", labelKey: "perfectFromRoot" },
  { q: "[root=علم & PASS]", labelKey: "passiveFromRoot" },
  { q: "[RES]", labelKey: "restriction" },
  { q: "[pos=V & !PASS] :: meccan", labelKey: "activeVerbsMeccan" },
  { q: "[COND] :: chrono > 5", labelKey: "conditionalsLate" },
  { q: "[vf=4 & cat=verb.impf]", labelKey: "formFour" },
];

/**
 * QCQL v1 — the query box, its results, and the permalink.
 *
 * The corpus indices are fetched once on first run and kept: occurrences
 * (~1.1 MB) and syntax (~215 KB) together answer every v1 query, and a
 * researcher runs many queries in a session. Nothing is fetched until a
 * query is actually run, so arriving at this page costs nothing.
 */
export function QueryPageContent({ surahs }: { surahs: SurahMeta[] }) {
  const t = useT();
  const [source, setSource] = useState("");
  const [corpus, setCorpus] = useState<QcqlCorpus | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QcqlResult | null>(null);
  const [error, setError] = useState<QcqlError | null>(null);
  const [ran, setRan] = useState("");
  const [page, setPage] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [verses, setVerses] = useState<Map<number, SurahFile>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);

  const surahByNum = useMemo(() => new Map(surahs.map((s) => [s.n, s])), [surahs]);

  const load = useCallback(async (): Promise<QcqlCorpus> => {
    if (corpus) return corpus;
    const [occurrences, syntax, index] = await Promise.all([
      getOccurrenceIndex(),
      getSyntaxIndex(),
      getIndex(),
    ]);
    const next: QcqlCorpus = { occurrences, syntax, index, surahs };
    setCorpus(next);
    return next;
  }, [corpus, surahs]);

  const run = useCallback(
    async (src: string) => {
      const trimmed = src.trim();
      if (trimmed === "") return;

      setLoading(true);
      setError(null);
      try {
        // Parse before fetching: a typo should not cost a 1.1 MB download.
        const query = parseQcql(trimmed);
        const loaded = await load();
        setResult(executeQcql(query, loaded));
        setRan(trimmed);
        setPage(0);
      } catch (e) {
        setResult(null);
        setRan(trimmed);
        setError(e instanceof QcqlError ? e : new QcqlError(t.queryPage.unexpectedError, 0));
      } finally {
        setLoading(false);
      }
    },
    [load, t.queryPage.unexpectedError],
  );

  // Read the URL once on mount. Split from the auto-run below so the run
  // waits for hydration rather than racing it -- same shape as
  // PhraseTextSearch, which restores a search from ?q= the same way.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get(QUERY_PARAM);
    if (fromUrl && fromUrl.trim() !== "") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from the URL, not a subscription; see comment above.
      setSource(fromUrl);
    }
    setHydrated(true);
  }, []);

  // Run whatever the URL carried, once, so a permalink is a result and not
  // just a pre-filled box.
  useEffect(() => {
    if (!hydrated || ran !== "" || source.trim() === "") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time run of a query restored from the URL, not a subscription; see comment above.
    void run(source);
    // Deliberately keyed on `hydrated` alone: depending on `run` or `source`
    // would re-execute the query on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Keep the URL in step with the query that actually ran, not the one being
  // typed -- replaceState so the back button still leaves the page.
  useEffect(() => {
    if (!ran) return;
    const url = new URL(window.location.href);
    url.searchParams.set(QUERY_PARAM, ran);
    window.history.replaceState(null, "", url);
  }, [ran]);

  const matches = useMemo(() => result?.matches ?? [], [result]);
  const pageCount = Math.ceil(matches.length / PAGE_SIZE);
  const pageMatches = useMemo(
    () => matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [matches, page],
  );

  // Only the surahs the visible page needs; getSurah is cached in the loader.
  useEffect(() => {
    if (pageMatches.length === 0) return;
    const needed = [...new Set(pageMatches.map((m) => m.s))].filter((n) => !verses.has(n));
    if (needed.length === 0) return;

    let cancelled = false;
    void Promise.all(needed.map((n) => getSurah(n))).then((files) => {
      if (cancelled) return;
      setVerses((prev) => {
        const next = new Map(prev);
        for (const f of files) next.set(f.n, f);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [pageMatches, verses]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">{t.queryPage.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.queryPage.subtitle}</p>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(source);
        }}
      >
        <input
          ref={inputRef}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          dir="ltr"
          placeholder={t.queryPage.placeholder}
          aria-label={t.queryPage.title}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading || source.trim() === ""}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent bg-accent/10 px-4 py-2 text-sm text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {t.queryPage.run}
        </button>
      </form>

      {error === null && result === null && !loading && (
        <div className="mt-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            {t.queryPage.examplesHeading}
          </h2>
          <ul className="mt-2 space-y-1.5">
            {EXAMPLES.map((ex) => (
              <li key={ex.q}>
                <button
                  type="button"
                  onClick={() => {
                    setSource(ex.q);
                    void run(ex.q);
                    inputRef.current?.focus();
                  }}
                  className="text-start text-sm text-muted transition-colors hover:text-accent"
                >
                  <code dir="ltr" className="font-mono text-accent/90">
                    {ex.q}
                  </code>
                  <span className="ms-2">{t.queryPage.examples[ex.labelKey]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error !== null && (
        <div className="mt-6 rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-ink">{error.message}</p>
          {/* Point at the character. A query language nobody can debug is a
              query language nobody uses. */}
          {error.text !== undefined && (
            <pre
              dir="ltr"
              className="mt-2 overflow-x-auto font-mono text-xs leading-relaxed text-muted"
            >
              {ran}
              {"\n"}
              {" ".repeat(error.at)}
              {"^".repeat(Math.max(1, error.text.length))}
            </pre>
          )}
        </div>
      )}

      {result !== null && (
        <div className="mt-6">
          <p className="text-sm text-muted">
            {t.queryPage.resultCount(result.matches.length, result.verseCount)}
          </p>

          {result.matches.length > 0 && (
            <>
              <div className="mt-3">
                {pageMatches.map((m) => {
                  const surahMeta = surahByNum.get(m.s);
                  const verse = verses.get(m.s)?.verses.find((v) => v.a === m.a);
                  if (!surahMeta || !verse) return null;
                  return (
                    <KwicRow
                      key={`${m.s}:${m.a}:${m.w}`}
                      surahMeta={surahMeta}
                      ayah={m.a}
                      tokens={verse.w}
                      wordIndex={m.w}
                    />
                  );
                })}
              </div>
              <div className="mt-4">
                <Pagination page={page} pageCount={pageCount} onChange={setPage} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Stated, not hidden: a word carrying neither a root nor a syntactic
          tag is in neither index, so no query can reach it. */}
      <p className="mt-10 border-t border-border pt-4 text-xs leading-relaxed text-muted/70">
        {t.queryPage.scopeNote}
      </p>
    </div>
  );
}
