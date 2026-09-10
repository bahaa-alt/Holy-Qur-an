"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getLemma, getMeta, getRoot, getVerses } from "@/lib/data/loader";
import { useT } from "@/lib/i18n/LanguageContext";
import { buildOccurrenceRows, buildVerseWordIndex, filterRows, type OccRow, type RowFilters } from "@/lib/root/occurrences";
import { buildExportRow } from "@/lib/export/buildRow";
import { CATEGORY_ORDER } from "@/lib/data/types";
import type { MetaFile, RootFile, SurahVerse } from "@/lib/data/types";
import { AyahCard } from "./AyahCard";
import { KwicRow } from "./KwicRow";
import { FilterBar } from "./FilterBar";
import { Pagination } from "./Pagination";
import { ExportMenu } from "@/components/export/ExportMenu";

const PAGE_SIZE = 25;
const EMPTY_VERSE_MAP = new Map<string, SurahVerse>();

export type AyahSource = { kind: "root"; root: string } | { kind: "lemma"; key: string };

export function AyahExplorer({
  source,
  filenameBase,
  initialFilters,
  filters: controlledFilters,
  onFiltersChange,
}: {
  source: AyahSource;
  filenameBase: string;
  initialFilters?: RowFilters;
  /** Makes filters optionally controlled (e.g. from a conjugation table's cell
   *  clicks). Omit both this and `onFiltersChange` for today's uncontrolled
   *  behavior, seeded from `initialFilters`. */
  filters?: RowFilters;
  onFiltersChange?: (next: RowFilters) => void;
}) {
  const t = useT();
  const root = source.kind === "root" ? source.root : null;
  const [file, setFile] = useState<RootFile | null>(null);
  const [meta, setMeta] = useState<MetaFile | null>(null);
  const [internalFilters, setInternalFilters] = useState<RowFilters>(initialFilters ?? {});
  const filters = controlledFilters ?? internalFilters;
  const [page, setPage] = useState(1);
  const [pageVerses, setPageVerses] = useState<Map<string, SurahVerse>>(new Map());
  const [viewMode, setViewMode] = useState<"cards" | "kwic">("cards");

  useEffect(() => {
    let cancelled = false;
    const filePromise = source.kind === "root" ? getRoot(source.root) : getLemma(source.key);
    Promise.all([filePromise, getMeta()]).then(([f, m]) => {
      if (!cancelled) {
        setFile(f);
        setMeta(m);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.kind, source.kind === "root" ? source.root : source.key]);

  const rows: OccRow[] = useMemo(() => (file ? buildOccurrenceRows(file) : []), [file]);
  const verseIndex = useMemo(() => (file ? buildVerseWordIndex(file) : new Map<string, number[]>()), [file]);

  const filteredRows = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleFiltersChange(next: RowFilters) {
    if (onFiltersChange) onFiltersChange(next);
    else setInternalFilters(next);
    setPage(1);
  }

  useEffect(() => {
    if (pageRows.length === 0) return;
    let cancelled = false;
    getVerses(pageRows.map((r) => ({ s: r.s, a: r.a }))).then((verses) => {
      if (!cancelled) setPageVerses(verses);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters, file]);

  // pageRows is empty right after filters narrow to nothing; nothing to show
  // and no verses to render regardless of whatever the last fetch left behind.
  const displayedPageVerses = pageRows.length === 0 ? EMPTY_VERSE_MAP : pageVerses;
  // Derived, not tracked as state: true exactly while the verses for the
  // current pageRows haven't all arrived (covers the async gap after a
  // page/filter change, while stale previous-page verses may still be in state).
  const isLoadingVerses =
    pageRows.length > 0 && !pageRows.every((r) => displayedPageVerses.has(`${r.s}:${r.a}`));

  const filterOptions = useMemo(() => {
    const catsPresent = new Set(rows.map((r) => r.cat));
    const lemmaMap = new Map<string, string>();
    const surahSet = new Set<number>();
    for (const r of rows) {
      lemmaMap.set(r.lemmaKey, r.lemma);
      surahSet.add(r.s);
    }
    return {
      categories: CATEGORY_ORDER.filter((c) => catsPresent.has(c)),
      lemmas: [...lemmaMap.entries()].map(([key, lemma]) => ({ key, lemma })),
      surahs: meta
        ? meta.surahs.filter((s) => surahSet.has(s.n)).map((s) => ({ n: s.n, label: s.translit }))
        : [],
    };
  }, [rows, meta]);

  async function resolveExportRows() {
    if (!meta) return [];
    const refs = filteredRows.map((r) => ({ s: r.s, a: r.a }));
    const verses = await getVerses(refs);
    return filteredRows
      .map((row) => {
        const verse = verses.get(`${row.s}:${row.a}`);
        const surahMeta = meta.surahs.find((s) => s.n === row.s);
        if (!verse || !surahMeta) return null;
        return buildExportRow(row, root, verse, surahMeta);
      })
      .filter((r) => r !== null);
  }

  if (!file || !meta) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" /> {t.ayahExplorer.loadingOccurrences}
      </div>
    );
  }

  return (
    <div id="ayah-explorer" className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-ink">{t.ayahExplorer.heading}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-border p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`rounded-md px-2.5 py-1 ${viewMode === "cards" ? "bg-accent text-accent-fg" : "text-muted"}`}
              >
                {t.ayahExplorer.cardsView}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kwic")}
                className={`rounded-md px-2.5 py-1 ${viewMode === "kwic" ? "bg-accent text-accent-fg" : "text-muted"}`}
              >
                {t.ayahExplorer.kwicView}
              </button>
            </div>
            <ExportMenu filenameBase={filenameBase} resolveRows={resolveExportRows} />
          </div>
        </div>

        <FilterBar
          filters={filters}
          options={filterOptions}
          onChange={handleFiltersChange}
          resultCount={filteredRows.length}
        />
      </div>

      <div className={viewMode === "cards" ? "mt-4 space-y-3" : "mt-4"}>
        {isLoadingVerses ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" /> {t.common.loadingVerses}
          </div>
        ) : (
          pageRows.map((row, i) => {
            const verse = displayedPageVerses.get(`${row.s}:${row.a}`);
            const surahMeta = meta.surahs.find((s) => s.n === row.s);
            if (!verse || !surahMeta) return null;
            return viewMode === "cards" ? (
              <AyahCard
                key={`${row.s}-${row.a}-${row.w}-${i}`}
                surahMeta={surahMeta}
                ayah={row.a}
                tokens={verse.w}
                translation={verse.t}
                pickthall={verse.pickthall}
                highlightIndices={verseIndex.get(`${row.s}:${row.a}`) ?? []}
                emphasisIndex={row.w}
              />
            ) : (
              <KwicRow
                key={`${row.s}-${row.a}-${row.w}-${i}`}
                surahMeta={surahMeta}
                ayah={row.a}
                tokens={verse.w}
                wordIndex={row.w}
              />
            );
          })
        )}
      </div>

      <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
