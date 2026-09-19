"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getIndex, getMeta, getOccurrenceIndex, getSyntaxIndex } from "@/lib/data/loader";
import { normalize } from "@/lib/arabic/normalize";
import { CATEGORY_LABELS } from "@/lib/data/types";
import { ROMAN_FORMS } from "@/lib/morphology/classify";
import {
  buildSyntaxLookups,
  filterOccurrences,
  type AdvancedSearchFilters,
  type AdvancedSearchRow,
  type SyntaxLookups,
} from "@/lib/search/advancedSearch";
import { decodeAdvancedSearchQuery, encodeAdvancedSearchQuery } from "@/lib/search/advancedSearchQuery";
import { AdvancedSearchResults } from "./AdvancedSearchResults";
import { describeTag } from "@/lib/morphology/tagLabels";
import { useT } from "@/lib/i18n/LanguageContext";
import type { Cat, IndexFile, MetaFile, OccurrenceIndexFile } from "@/lib/data/types";

const ALL_CATS = Object.keys(CATEGORY_LABELS) as Cat[];
const ALL_FORMS = Array.from({ length: 11 }, (_, i) => i + 1);
// Mirrors scripts/lib/build-syntax.ts's SYNTAX_TAGS. Duplicated rather than
// imported because that module lives under scripts/ and pulls in the build
// pipeline's types; the pipeline asserts the emitted vocabulary matches its
// own list, and decodeAdvancedSearchQuery only uses this to reject stale
// tags from a hand-edited URL, so a drift here degrades to "filter ignored",
// never to a wrong result.
const ALL_SYNTAX_TAGS: ReadonlySet<string> = new Set([
  "ADDR", "AMD", "ANS", "ATT", "AVR", "CAUS", "CERT", "CIRC", "COM", "COND",
  "EMPH", "EQ", "EXH", "EXL", "EXP", "FUT", "INC", "INT", "INTG", "NEG",
  "PASS", "PREV", "PRO", "PRP", "REM", "RES", "RET", "RSLT", "SUB", "SUP",
  "SUR", "T", "VOC",
]);
const PAGE_SIZE = 25;

function toggle<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function AdvancedSearchView() {
  const t = useT();
  const [data, setData] = useState<{ occ: OccurrenceIndexFile; meta: MetaFile; index: IndexFile } | null>(null);

  const [cats, setCats] = useState<Set<Cat>>(new Set());
  const [forms, setForms] = useState<Set<number>>(new Set());
  const [revelation, setRevelation] = useState<"all" | "meccan" | "medinan">("all");
  const [rootQuery, setRootQuery] = useState("");
  const [rootFilters, setRootFilters] = useState<Set<string>>(new Set());
  const [wordSyntax, setWordSyntax] = useState<Set<string>>(new Set());
  const [verseSyntax, setVerseSyntax] = useState<Set<string>>(new Set());
  const [syntax, setSyntax] = useState<SyntaxLookups | null>(null);
  const [syntaxTags, setSyntaxTags] = useState<string[]>([]);
  const [surahFrom, setSurahFrom] = useState(1);
  const [surahTo, setSurahTo] = useState(114);
  const [page, setPage] = useState(0);
  // Starts false to match the prerendered static HTML (a static-export page
  // has no server to answer differing query strings, so the initial state
  // above -- all defaults -- is what gets prerendered). The real filters
  // are read from the URL in the mount effect below, strictly *after*
  // hydration, matching /compare/'s CompareView (see its comments for why
  // reading the URL via useState's lazy initializer instead would trip a
  // hydration mismatch on a direct/deep link carrying query params).
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    Promise.all([getOccurrenceIndex(), getMeta(), getIndex()]).then(([occ, meta, index]) =>
      setData({ occ, meta, index }),
    );
  }, []);

  // Fetched separately from the three above: the tag facets are the only
  // thing that needs it, and it is the one index a session can finish
  // without ever touching. Until it lands, filterOccurrences ignores the
  // tag facets rather than matching nothing (see AdvancedSearchFilters).
  useEffect(() => {
    getSyntaxIndex().then((file) => {
      setSyntax(buildSyntaxLookups(file));
      const counts = new Map<string, number>();
      for (const t of file.t) {
        const tag = file.tags[t];
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
      setSyntaxTags(
        [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag),
      );
    });
  }, []);

  // One-time hydration from the URL so a shared/bookmarked link restores
  // its filters. Runs once on mount; see the `hydrated` comment above.
  useEffect(() => {
    const decoded = decodeAdvancedSearchQuery(window.location.search, new Set(ALL_CATS), ALL_SYNTAX_TAGS);
    if (decoded.cats.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from the URL, not a subscription; see the `hydrated` comment above.
      setCats(new Set(decoded.cats));
    }
    if (decoded.verbForms.length > 0) {
      setForms(new Set(decoded.verbForms));
    }
    if (decoded.revelation !== "all") {
      setRevelation(decoded.revelation);
    }
    if (decoded.rootArs.length > 0) {
      setRootFilters(new Set(decoded.rootArs));
    }
    if (decoded.wordSyntaxTags.length > 0) {
      setWordSyntax(new Set(decoded.wordSyntaxTags));
    }
    if (decoded.verseSyntaxTags.length > 0) {
      setVerseSyntax(new Set(decoded.verseSyntaxTags));
    }
    if (decoded.surahFrom !== 1) {
      setSurahFrom(decoded.surahFrom);
    }
    if (decoded.surahTo !== 114) {
      setSurahTo(decoded.surahTo);
    }
    if (decoded.page !== 0) {
      setPage(decoded.page);
    }
    setHydrated(true);
  }, []);

  // Keeps the URL in sync with the current filters so the page is
  // shareable/bookmarkable -- a legitimate "sync state to an external
  // system" effect, not a state-reset-on-prop-change. Skipped until after
  // the hydration effect above has run, so it never clobbers a query
  // string with the pre-hydration default filters.
  useEffect(() => {
    if (!hydrated) return;
    const query = encodeAdvancedSearchQuery({
      cats: [...cats],
      verbForms: [...forms],
      revelation,
      rootArs: [...rootFilters],
      wordSyntaxTags: [...wordSyntax],
      verseSyntaxTags: [...verseSyntax],
      surahFrom,
      surahTo,
      page,
    });
    const next = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", next);
  }, [cats, forms, revelation, rootFilters, wordSyntax, verseSyntax, surahFrom, surahTo, page, hydrated]);

  const rootMatches = useMemo(() => {
    if (!data) return [];
    const q = normalize(rootQuery.trim());
    if (q === "") return [];
    return data.index.roots.filter((r) => r.key.includes(q) && !rootFilters.has(r.ar)).slice(0, 8);
  }, [data, rootQuery, rootFilters]);

  const allRows: AdvancedSearchRow[] = useMemo(() => {
    if (!data) return [];
    const rootIdxs =
      rootFilters.size > 0
        ? new Set(
            [...rootFilters]
              .map((ar) => data.index.roots.findIndex((r) => r.ar === ar))
              .filter((i): i is number => i >= 0),
          )
        : undefined;
    const from = Math.min(surahFrom, surahTo);
    const to = Math.max(surahFrom, surahTo);
    const surahs = new Set(Array.from({ length: to - from + 1 }, (_, i) => from + i));
    const filters: AdvancedSearchFilters = {
      cats: cats.size > 0 ? cats : undefined,
      verbForms: forms.size > 0 ? forms : undefined,
      rootIdxs,
      surahs,
      revelationType: revelation === "all" ? undefined : revelation,
      wordSyntaxTags: wordSyntax.size > 0 ? wordSyntax : undefined,
      verseSyntaxTags: verseSyntax.size > 0 ? verseSyntax : undefined,
      syntax: syntax ?? undefined,
    };
    return filterOccurrences(data.occ, data.meta, filters);
  }, [data, cats, forms, revelation, rootFilters, wordSyntax, verseSyntax, syntax, surahFrom, surahTo]);

  const pageCount = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = allRows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const resultsKey = pageRows.map((r) => `${r.s}.${r.a}.${r.w}`).join("_") || `empty-${currentPage}`;

  const hasFilters =
    cats.size > 0 ||
    forms.size > 0 ||
    revelation !== "all" ||
    rootFilters.size > 0 ||
    wordSyntax.size > 0 ||
    verseSyntax.size > 0 ||
    surahFrom !== 1 ||
    surahTo !== 114;

  function clearFilters() {
    setCats(new Set());
    setForms(new Set());
    setRevelation("all");
    setRootFilters(new Set());
    setRootQuery("");
    setWordSyntax(new Set());
    setVerseSyntax(new Set());
    setSurahFrom(1);
    setSurahTo(114);
    setPage(0);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.advancedSearchPage.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.advancedSearchPage.subtitle}</p>
      </div>

      {!data ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.advancedSearchPage.loading}
        </p>
      ) : (
        <>
          <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
                {t.advancedSearchPage.categoryLabel}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_CATS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCats((prev) => toggle(prev, cat));
                      setPage(0);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      cats.has(cat)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-ink hover:border-accent"
                    }`}
                  >
                    {t.categories[cat]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
                {t.advancedSearchPage.verbFormLabel}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_FORMS.map((form) => (
                  <button
                    key={form}
                    type="button"
                    onClick={() => {
                      setForms((prev) => toggle(prev, form));
                      setPage(0);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      forms.has(form)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-ink hover:border-accent"
                    }`}
                  >
                    {ROMAN_FORMS[String(form)]}
                  </button>
                ))}
              </div>
            </div>

            {syntaxTags.length > 0 && (
              <>
                <div>
                  <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
                    {t.advancedSearchPage.wordSyntaxLabel}
                  </h2>
                  <p className="mt-1 text-xs text-muted">{t.advancedSearchPage.wordSyntaxHint}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {syntaxTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setWordSyntax((prev) => toggle(prev, tag));
                          setPage(0);
                        }}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          wordSyntax.has(tag)
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-ink hover:border-accent"
                        }`}
                      >
                        {describeTag(tag).en}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
                    {t.advancedSearchPage.verseSyntaxLabel}
                  </h2>
                  <p className="mt-1 text-xs text-muted">{t.advancedSearchPage.verseSyntaxHint}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {syntaxTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setVerseSyntax((prev) => toggle(prev, tag));
                          setPage(0);
                        }}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          verseSyntax.has(tag)
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-ink hover:border-accent"
                        }`}
                      >
                        {describeTag(tag).en}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
                {t.advancedSearchPage.rootLabel}
              </h2>
              {rootFilters.size > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {[...rootFilters].map((root) => (
                    <span
                      key={root}
                      className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-ink"
                    >
                      {root}
                      <button
                        type="button"
                        onClick={() => {
                          setRootFilters((prev) => toggle(prev, root));
                          setPage(0);
                        }}
                        aria-label={t.advancedSearchPage.rootClear(root)}
                        className="text-muted hover:text-ink"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2">
                <input
                  type="text"
                  value={rootQuery}
                  onChange={(e) => setRootQuery(e.target.value)}
                  placeholder={t.advancedSearchPage.rootPlaceholder}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none"
                />
                {rootMatches.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {rootMatches.map((r) => (
                      <button
                        key={r.ar}
                        type="button"
                        onClick={() => {
                          setRootFilters((prev) => toggle(prev, r.ar));
                          setRootQuery("");
                          setPage(0);
                        }}
                        className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
                      >
                        <span>{r.ar}</span>
                        <span className="text-xs text-muted">{r.count.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
                {t.advancedSearchPage.surahRangeLabel}
              </h2>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-ink">
                  {t.advancedSearchPage.surahFromLabel}
                  <input
                    type="number"
                    min={1}
                    max={114}
                    value={surahFrom}
                    onChange={(e) => {
                      setSurahFrom(Math.min(114, Math.max(1, Number(e.target.value) || 1)));
                      setPage(0);
                    }}
                    className="w-20 rounded-lg border border-border px-2 py-1 text-sm text-ink focus:outline-none"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-ink">
                  {t.advancedSearchPage.surahToLabel}
                  <input
                    type="number"
                    min={1}
                    max={114}
                    value={surahTo}
                    onChange={(e) => {
                      setSurahTo(Math.min(114, Math.max(1, Number(e.target.value) || 114)));
                      setPage(0);
                    }}
                    className="w-20 rounded-lg border border-border px-2 py-1 text-sm text-ink focus:outline-none"
                  />
                </label>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
                {t.advancedSearchPage.revelationLabel}
              </h2>
              <div className="mt-2 flex gap-2">
                {(["all", "meccan", "medinan"] as const).map((rev) => (
                  <button
                    key={rev}
                    type="button"
                    onClick={() => {
                      setRevelation(rev);
                      setPage(0);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      revelation === rev
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-ink hover:border-accent"
                    }`}
                  >
                    {rev === "all"
                      ? t.advancedSearchPage.revelationAll
                      : rev === "meccan"
                        ? t.advancedSearchPage.revelationMeccan
                        : t.advancedSearchPage.revelationMedinan}
                  </button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <button type="button" onClick={clearFilters} className="text-sm text-accent hover:text-accent-strong">
                {t.advancedSearchPage.clearFilters}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{t.advancedSearchPage.resultCount(allRows.length)}</p>
            {pageCount > 1 && (
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                  className="text-accent hover:text-accent-strong disabled:text-muted disabled:opacity-50"
                >
                  {t.advancedSearchPage.previousPage}
                </button>
                <span className="text-muted">{t.advancedSearchPage.pageOf(currentPage + 1, pageCount)}</span>
                <button
                  type="button"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => setPage(currentPage + 1)}
                  className="text-accent hover:text-accent-strong disabled:text-muted disabled:opacity-50"
                >
                  {t.advancedSearchPage.nextPage}
                </button>
              </div>
            )}
          </div>

          {allRows.length === 0 ? (
            <p className="text-sm text-muted">{t.advancedSearchPage.noResults}</p>
          ) : (
            <AdvancedSearchResults key={resultsKey} rows={pageRows} index={data.index} meta={data.meta} />
          )}
        </>
      )}
    </div>
  );
}
