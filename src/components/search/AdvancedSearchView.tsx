"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getIndex, getMeta, getOccurrenceIndex } from "@/lib/data/loader";
import { normalize } from "@/lib/arabic/normalize";
import { CATEGORY_LABELS } from "@/lib/data/types";
import { ROMAN_FORMS } from "@/lib/morphology/classify";
import { filterOccurrences, type AdvancedSearchFilters, type AdvancedSearchRow } from "@/lib/search/advancedSearch";
import { AdvancedSearchResults } from "./AdvancedSearchResults";
import { useT } from "@/lib/i18n/LanguageContext";
import type { Cat, IndexFile, MetaFile, OccurrenceIndexFile } from "@/lib/data/types";

const ALL_CATS = Object.keys(CATEGORY_LABELS) as Cat[];
const ALL_FORMS = Array.from({ length: 11 }, (_, i) => i + 1);
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
  const [rootFilterAr, setRootFilterAr] = useState<string | null>(null);
  const [surahFrom, setSurahFrom] = useState(1);
  const [surahTo, setSurahTo] = useState(114);
  const [page, setPage] = useState(0);

  useEffect(() => {
    Promise.all([getOccurrenceIndex(), getMeta(), getIndex()]).then(([occ, meta, index]) =>
      setData({ occ, meta, index }),
    );
  }, []);

  const rootMatches = useMemo(() => {
    if (!data) return [];
    const q = normalize(rootQuery.trim());
    if (q === "") return [];
    return data.index.roots.filter((r) => r.key.includes(q)).slice(0, 8);
  }, [data, rootQuery]);

  const allRows: AdvancedSearchRow[] = useMemo(() => {
    if (!data) return [];
    const rootIdxs = rootFilterAr
      ? new Set(
          [data.index.roots.findIndex((r) => r.ar === rootFilterAr)].filter((i): i is number => i >= 0),
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
    };
    return filterOccurrences(data.occ, data.meta, filters);
  }, [data, cats, forms, revelation, rootFilterAr, surahFrom, surahTo]);

  const pageCount = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = allRows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const resultsKey = pageRows.map((r) => `${r.s}.${r.a}.${r.w}`).join("_") || `empty-${currentPage}`;

  const hasFilters = cats.size > 0 || forms.size > 0 || revelation !== "all" || rootFilterAr !== null || surahFrom !== 1 || surahTo !== 114;

  function clearFilters() {
    setCats(new Set());
    setForms(new Set());
    setRevelation("all");
    setRootFilterAr(null);
    setRootQuery("");
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

            <div>
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
                {t.advancedSearchPage.rootLabel}
              </h2>
              {rootFilterAr ? (
                <div className="mt-2">
                  <span className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-ink">
                    {rootFilterAr}
                    <button
                      type="button"
                      onClick={() => {
                        setRootFilterAr(null);
                        setPage(0);
                      }}
                      aria-label={t.advancedSearchPage.rootClear}
                      className="text-muted hover:text-ink"
                    >
                      <X size={13} />
                    </button>
                  </span>
                </div>
              ) : (
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
                            setRootFilterAr(r.ar);
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
              )}
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
