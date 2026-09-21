"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { getCollocations, getIndex, getMeta } from "@/lib/data/loader";
import { normalize } from "@/lib/arabic/normalize";
import { rootHref } from "@/lib/search/suggest";
import { metricBarPct } from "@/lib/insights/metricScale";
import { scopedCollocationRows, type ScopedCollocationRow } from "@/lib/insights/collocationScope";
import { inScope, scopeFromParam, scopeToParam, type Scope } from "@/lib/insights/scope";
import { CollocationDetail } from "./CollocationDetail";
import { ScopeSelector } from "./ScopeSelector";
import { ExportButton } from "@/components/export/ExportButton";
import { SaveButton } from "@/components/notes/SaveButton";
import { useUrlParam } from "@/lib/hooks/useUrlParam";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ExportTable } from "@/lib/export/table";
import type { CollocationsFile, IndexFile, MetaFile } from "@/lib/data/types";

type SortMode = "count" | "pmi";
const SORT_PILL_CLASS = (active: boolean) =>
  `rounded-md px-3 py-1 text-xs ${active ? "bg-accent text-accent-fg" : "text-muted"}`;

function Bar({
  row,
  values,
  metric,
  pmiLabel,
  active,
  onClick,
}: {
  row: ScopedCollocationRow;
  values: readonly number[];
  metric: SortMode;
  pmiLabel: string;
  active: boolean;
  onClick: () => void;
}) {
  const pct = metricBarPct(metric === "count" ? row.scopedCount : row.pmi, values);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg py-1.5 ps-2 pe-1 transition-colors ${active ? "bg-accent/10" : "hover:bg-bg"}`}
    >
      <div className="arabic-ui w-20 shrink-0 text-start text-sm text-ink">
        {row.prepositionLemma}
      </div>
      <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
        <div className="h-full rounded bg-accent/70" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-32 shrink-0 text-end text-xs text-muted">
        {row.scopedCount.toLocaleString()}
        {metric === "pmi" && ` · ${pmiLabel}`}
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
  const [selectedRoot, setSelectedRoot] = useUrlParam<string | null>(
    "collocRoot",
    null,
    (raw) => raw,
    (v) => v,
  );
  const [sortMode, setSortMode] = useState<SortMode>("count");
  const [selectedCombo, setSelectedCombo] = useState<string | null>(null);
  const [scope, setScope] = useUrlParam<Scope>(
    "collocScope",
    { kind: "quran" },
    scopeFromParam,
    scopeToParam,
  );

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

  // PMI only means what it says at whole-Qur'an scope (see
  // collocationScope.ts); a narrower scope always ranks by the scoped
  // count, whatever sortMode remembers from a previous quran-scope visit.
  const effectiveSortMode: SortMode = scope.kind === "quran" ? sortMode : "count";

  const rows = useMemo(() => {
    if (!collocations || !selectedRoot) return [];
    const base = collocations.verbPrepositions.filter((r) => r.verbRootAr === selectedRoot);
    const scoped = scopedCollocationRows(base, scope);
    return effectiveSortMode === "count"
      ? [...scoped].sort((a, b) => b.scopedCount - a.scopedCount)
      : [...scoped].sort((a, b) => b.pmi - a.pmi);
  }, [collocations, selectedRoot, scope, effectiveSortMode]);
  const metricValues = rows.map((r) => (effectiveSortMode === "count" ? r.scopedCount : r.pmi));

  const selectedRow = rows.find((r) => r.prepositionKey === selectedCombo) ?? null;
  const loading = !collocations || !index || !meta;

  function buildTable(): ExportTable {
    const scopeLabel = scopeToParam(scope);
    return {
      slug: `collocations-${selectedRoot ?? "root"}-${scopeLabel.replace(":", "-")}`,
      meta: {
        title: `${t.insightsPage.collocationsHeading}: ${selectedRoot ?? ""}`,
        provenance: [
          { label: "verb root", value: selectedRoot ?? "" },
          { label: "scope", value: scopeLabel },
          { label: "pmi", value: "measured over the whole Qur'an; does not vary with scope" },
        ],
      },
      columns: [
        { key: "preposition", label: "preposition" },
        { key: "count_in_scope", label: "count_in_scope" },
        { key: "pmi_whole_quran", label: "pmi_whole_quran" },
      ],
      rows: rows.map((r) => [r.prepositionLemma, r.scopedCount, r.pmi.toFixed(3)]),
    };
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.collocationsHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.collocationsDescription}</p>

      <div className="mt-4">
        {meta && (
          <ScopeSelector
            scope={scope}
            onChange={setScope}
            meta={meta}
            labels={t.insightsPage.compare}
          />
        )}
      </div>

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
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  {scope.kind === "quran" ? (
                    <div className="flex w-fit rounded-lg border border-border p-0.5">
                      <button
                        type="button"
                        onClick={() => setSortMode("count")}
                        className={SORT_PILL_CLASS(sortMode === "count")}
                      >
                        {t.insightsPage.sortByFrequency}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortMode("pmi")}
                        className={SORT_PILL_CLASS(sortMode === "pmi")}
                      >
                        {t.insightsPage.sortByPmi}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted">{t.insightsPage.collocationsScopedPmiNote}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <SaveButton
                      id={`view:collocations:${selectedRoot}:${scopeToParam(scope)}`}
                      kind="view"
                      label={`${t.insightsPage.collocationsHeading}: ${selectedRoot}`}
                      detail={scopeToParam(scope)}
                      href={`/insights/?tab=collocations&collocRoot=${encodeURIComponent(selectedRoot)}&collocScope=${scopeToParam(scope)}`}
                      compact
                    />
                    <ExportButton
                      path={`/insights/?tab=collocations&collocRoot=${encodeURIComponent(selectedRoot)}&collocScope=${scopeToParam(scope)}`}
                      subject={{ kind: "collocations", label: selectedRoot }}
                      resolve={buildTable}
                    />
                  </div>
                </div>
                {effectiveSortMode === "pmi" && (
                  <p className="mb-2 text-xs text-muted">{t.insightsPage.pmiExplanation}</p>
                )}
                {rows.map((row) => (
                  <Bar
                    key={row.prepositionKey}
                    row={row}
                    values={metricValues}
                    metric={effectiveSortMode}
                    pmiLabel={t.insightsPage.pmiLabel(row.pmi.toFixed(2))}
                    active={selectedCombo === row.prepositionKey}
                    onClick={() =>
                      setSelectedCombo((prev) =>
                        prev === row.prepositionKey ? null : row.prepositionKey,
                      )
                    }
                  />
                ))}
                <Link
                  href={rootHref(selectedRoot)}
                  className="mt-2 inline-block text-xs text-accent hover:text-accent-strong"
                >
                  {selectedRoot} →
                </Link>

                {selectedRow && (
                  <div className="mt-4 border-t border-border pt-4">
                    <CollocationDetail
                      key={`${selectedRow.verbRootAr}|${selectedRow.prepositionKey}|${scopeToParam(scope)}`}
                      refs={selectedRow.refs.filter((ref) => inScope(scope, ref))}
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
