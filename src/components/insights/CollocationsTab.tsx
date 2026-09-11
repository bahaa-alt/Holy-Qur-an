"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { getCollocations, getIndex, getMeta } from "@/lib/data/loader";
import { normalize } from "@/lib/arabic/normalize";
import { rootHref } from "@/lib/search/suggest";
import { metricBarPct } from "@/lib/insights/metricScale";
import { CollocationDetail } from "./CollocationDetail";
import { useT } from "@/lib/i18n/LanguageContext";
import type { CollocationsFile, IndexFile, MetaFile, VerbPrepositionRow } from "@/lib/data/types";

type SortMode = "count" | "pmi";
const SORT_PILL_CLASS = (active: boolean) => `rounded-md px-3 py-1 text-xs ${active ? "bg-accent text-accent-fg" : "text-muted"}`;

function Bar({
  row,
  values,
  metric,
  pmiLabel,
  active,
  onClick,
}: {
  row: VerbPrepositionRow;
  values: readonly number[];
  metric: SortMode;
  pmiLabel: string;
  active: boolean;
  onClick: () => void;
}) {
  const pct = metricBarPct(metric === "count" ? row.count : row.pmi, values);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg py-1.5 ps-2 pe-1 transition-colors ${active ? "bg-accent/10" : "hover:bg-bg"}`}
    >
      <div className="arabic-ui w-20 shrink-0 text-start text-sm text-ink">{row.prepositionLemma}</div>
      <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
        <div className="h-full rounded bg-accent/70" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-32 shrink-0 text-end text-xs text-muted">
        {row.count.toLocaleString()} · {pmiLabel}
      </div>
    </button>
  );
}

export function CollocationsTab() {
  const t = useT();
  const [collocations, setCollocations] = useState<CollocationsFile | null>(null);
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [meta, setMeta] = useState<MetaFile | null>(null);
  const [query, setQuery] = useState("");
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("count");
  const [selectedCombo, setSelectedCombo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCollocations(), getIndex(), getMeta()]).then(([c, i, m]) => {
      if (!cancelled) {
        setCollocations(c);
        setIndex(i);
        setMeta(m);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const surahMetaByNum = useMemo(() => new Map(meta?.surahs.map((s) => [s.n, s]) ?? []), [meta]);

  const matches = useMemo(() => {
    if (!index) return [];
    const q = normalize(query.trim());
    if (q === "") return [];
    return index.roots.filter((r) => r.key.includes(q)).slice(0, 8);
  }, [index, query]);

  const rows = useMemo(() => {
    if (!collocations || !selectedRoot) return [];
    const base = collocations.verbPrepositions.filter((r) => r.verbRootAr === selectedRoot);
    return sortMode === "count" ? [...base].sort((a, b) => b.count - a.count) : [...base].sort((a, b) => b.pmi - a.pmi);
  }, [collocations, selectedRoot, sortMode]);
  const metricValues = rows.map((r) => (sortMode === "count" ? r.count : r.pmi));

  const selectedRow = rows.find((r) => r.prepositionKey === selectedCombo) ?? null;
  const loading = !collocations || !index || !meta;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.collocationsHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.collocationsDescription}</p>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.collocationsLoading}
        </p>
      ) : (
        <>
          <div className="mt-4">
            {selectedRoot ? (
              <span className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-ink">
                {selectedRoot}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoot(null);
                    setQuery("");
                    setSelectedCombo(null);
                  }}
                  className="text-muted hover:text-ink"
                >
                  <X size={13} />
                </button>
              </span>
            ) : (
              <>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.insightsPage.collocationsRootPlaceholder}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none"
                />
                {matches.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {matches.map((r) => (
                      <button
                        key={r.ar}
                        type="button"
                        onClick={() => {
                          setSelectedRoot(r.ar);
                          setQuery("");
                          setSelectedCombo(null);
                        }}
                        className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
                      >
                        {r.ar}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-4 border-t border-border pt-4">
            {selectedRoot === null ? (
              <p className="text-sm text-muted">{t.insightsPage.collocationsPickPrompt}</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted">{t.insightsPage.collocationsNoResults}</p>
            ) : (
              <>
                <div className="mb-2 flex justify-end">
                  <div className="flex w-fit rounded-lg border border-border p-0.5">
                    <button type="button" onClick={() => setSortMode("count")} className={SORT_PILL_CLASS(sortMode === "count")}>
                      {t.insightsPage.sortByFrequency}
                    </button>
                    <button type="button" onClick={() => setSortMode("pmi")} className={SORT_PILL_CLASS(sortMode === "pmi")}>
                      {t.insightsPage.sortByPmi}
                    </button>
                  </div>
                </div>
                {sortMode === "pmi" && <p className="mb-2 text-xs text-muted">{t.insightsPage.pmiExplanation}</p>}
                {rows.map((row) => (
                  <Bar
                    key={row.prepositionKey}
                    row={row}
                    values={metricValues}
                    metric={sortMode}
                    pmiLabel={t.insightsPage.pmiLabel(row.pmi.toFixed(2))}
                    active={selectedCombo === row.prepositionKey}
                    onClick={() => setSelectedCombo((prev) => (prev === row.prepositionKey ? null : row.prepositionKey))}
                  />
                ))}
                <Link href={rootHref(selectedRoot)} className="mt-2 inline-block text-xs text-accent hover:text-accent-strong">
                  {selectedRoot} →
                </Link>

                {selectedRow && (
                  <div className="mt-4 border-t border-border pt-4">
                    <CollocationDetail
                      key={`${selectedRow.verbRootAr}|${selectedRow.prepositionKey}`}
                      refs={selectedRow.refs}
                      surahMetaByNum={surahMetaByNum}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
