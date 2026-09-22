"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { getCooccurrence, getIndex, getVerseRoots } from "@/lib/data/loader";
import { normalize } from "@/lib/arabic/normalize";
import { rootHref } from "@/lib/search/suggest";
import { metricBarPct } from "@/lib/insights/metricScale";
import { scopedCooccurrencePartners, scopedTopPairs } from "@/lib/insights/cooccurrenceScope";
import { buildVerseRefs, scopeFromParam, scopeToParam, type Scope } from "@/lib/insights/scope";
import { ScopeSelector } from "./ScopeSelector";
import { ExportButton } from "@/components/export/ExportButton";
import { SaveButton } from "@/components/notes/SaveButton";
import { useUrlParam } from "@/lib/hooks/useUrlParam";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ExportTable } from "@/lib/export/table";
import type { CooccurrenceFile, IndexFile, MetaFile, VerseRootsFile } from "@/lib/data/types";

type SortMode = "count" | "pmi";
const SORT_PILL_CLASS = (active: boolean) =>
  `rounded-md px-3 py-1 text-xs ${active ? "bg-accent text-accent-fg" : "text-muted"}`;
/**
 * The whole-Qur'an partner list was always ≤10 (byRoot's union of top 5 by
 * count and top 5 by PMI, baked in at build time) -- a scope computed
 * client-side has no such ceiling, and a common root in a broad scope can
 * have dozens of one-shared-verse partners. Capped the same way the top
 * pairs list already is, so a wide scope doesn't turn one bar chart into a
 * hundred indistinguishable slivers.
 */
const PARTNERS_SHOWN = 15;
/** Both verified against cooccurrence.json: 10 and 9 partners respectively. */
const COOCCURRENCE_EXAMPLE_ROOTS = ["كتب", "رحم"];

/** A shared-verse pair, PMI/significance carried only when it means something (see cooccurrenceScope.ts). */
interface TopPairRow {
  rootA: string;
  rootB: string;
  count: number;
  pmi?: number;
  g2?: number;
  p?: number;
  qValue?: number;
}

/** One root's co-occurrence partner: PMI and a q-value only, not the raw G²/p (see RootCooccurrencePartner). */
interface PartnerRow {
  root: string;
  count: number;
  pmi?: number;
  qValue?: number;
}

function PartnerBar({
  row,
  values,
  metric,
  pmiLabel,
  sigLabel,
}: {
  row: PartnerRow;
  values: readonly number[];
  metric: SortMode;
  pmiLabel: string;
  sigLabel: string | null;
}) {
  const pct = metricBarPct(metric === "count" ? row.count : (row.pmi ?? 0), values);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Link
        href={rootHref(row.root)}
        className="arabic-ui w-20 shrink-0 text-sm text-accent hover:text-accent-strong"
      >
        {row.root}
      </Link>
      <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
        <div className="h-full rounded bg-accent/70" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-36 shrink-0 text-end text-xs text-muted">
        {row.count.toLocaleString()}
        {row.pmi !== undefined && ` · ${pmiLabel}`}
        {sigLabel && <div className="text-[10px] text-muted/70">{sigLabel}</div>}
      </div>
    </div>
  );
}

/**
 * Root co-occurrence: which pairs of roots share the most verses, and
 * which roots co-occur most with a given root.
 *
 * Was whole-Qur'an-only, like Collocations before it: the shipped
 * cooccurrence.json is corpus-wide aggregates with no per-pair verse
 * list, so scoping this had to be a real computation over
 * verse-roots.json (see cooccurrenceScope.ts) rather than a filter over
 * shipped refs -- there is nothing here to filter. At whole-Qur'an
 * scope the original precomputed figures are used unchanged, PMI
 * included; at any other scope, counts are recomputed and PMI is left
 * out rather than approximated into a different, silently
 * non-comparable quantity (same reasoning as Collocations).
 */
export function CooccurrenceTab({ meta }: { meta: MetaFile }) {
  const t = useT();
  const [cooccurrence, setCooccurrence] = useState<CooccurrenceFile | null>(null);
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [verseRoots, setVerseRoots] = useState<VerseRootsFile | null>(null);
  const [query, setQuery] = useState("");
  const [selectedRoot, setSelectedRoot] = useUrlParam<string | null>(
    "cooccurRoot",
    null,
    (raw) => raw,
    (v) => v,
  );
  const [sortMode, setSortMode] = useState<SortMode>("count");
  const [scope, setScope] = useUrlParam<Scope>(
    "cooccurScope",
    { kind: "quran" },
    scopeFromParam,
    scopeToParam,
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCooccurrence(), getIndex(), getVerseRoots()]).then(([c, i, vr]) => {
      if (!cancelled) {
        setCooccurrence(c);
        setIndex(i);
        setVerseRoots(vr);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refs = useMemo(() => buildVerseRefs(meta), [meta]);
  const rootNames = useMemo(() => index?.roots.map((r) => r.ar) ?? [], [index]);

  const matches = useMemo(() => {
    if (!index) return [];
    const q = normalize(query.trim());
    if (q === "") return [];
    return index.roots.filter((r) => r.key.includes(q)).slice(0, 8);
  }, [index, query]);

  // PMI only means what it says at whole-Qur'an scope (see
  // cooccurrenceScope.ts); a narrower scope always ranks by the recomputed
  // count, whatever sortMode remembers from a previous quran-scope visit.
  const effectiveSortMode: SortMode = scope.kind === "quran" ? sortMode : "count";

  const topPairs = useMemo<TopPairRow[]>(() => {
    if (scope.kind === "quran") {
      return (sortMode === "count" ? cooccurrence?.topPairs : cooccurrence?.topPairsByPmi) ?? [];
    }
    return verseRoots ? scopedTopPairs(verseRoots, refs, scope, rootNames) : [];
  }, [cooccurrence, verseRoots, refs, scope, sortMode, rootNames]);

  const partners = useMemo<PartnerRow[]>(() => {
    if (!selectedRoot) return [];
    if (scope.kind === "quran") {
      const base = cooccurrence?.byRoot[selectedRoot] ?? [];
      return effectiveSortMode === "count"
        ? [...base].sort((a, b) => b.count - a.count)
        : [...base].sort((a, b) => b.pmi - a.pmi);
    }
    if (!verseRoots) return [];
    const targetIdx = rootNames.indexOf(selectedRoot);
    if (targetIdx === -1) return [];
    return scopedCooccurrencePartners(verseRoots, refs, scope, targetIdx, rootNames);
  }, [cooccurrence, verseRoots, refs, scope, selectedRoot, effectiveSortMode, rootNames]);
  const shownPartners = partners.slice(0, PARTNERS_SHOWN);
  const partnerMetricValues = shownPartners.map((p) =>
    effectiveSortMode === "count" ? p.count : (p.pmi ?? 0),
  );

  const loading = !cooccurrence || !index || !verseRoots;

  function buildPairsTable(): ExportTable {
    const scopeLabel = scopeToParam(scope);
    return {
      slug: `cooccurrence-pairs-${scopeLabel.replace(":", "-")}`,
      meta: {
        title: t.insightsPage.cooccurrenceTopPairsHeading,
        provenance: [
          { label: "scope", value: scopeLabel },
          { label: "measure", value: "distinct shared verses" },
          {
            label: "pmi, g2, p-value, fdr q-value",
            value: "measured over the whole Qur'an (Dunning 1993); do not vary with scope",
          },
        ],
      },
      columns: [
        { key: "root_a", label: "root_a" },
        { key: "root_b", label: "root_b" },
        { key: "shared_verses", label: "shared_verses" },
        { key: "pmi_whole_quran", label: "pmi_whole_quran" },
        { key: "log_likelihood_g2", label: "log_likelihood_g2" },
        { key: "p_value", label: "p_value" },
        { key: "fdr_q_value", label: "fdr_q_value" },
      ],
      rows: topPairs.map((p) => [
        p.rootA,
        p.rootB,
        p.count,
        p.pmi !== undefined ? p.pmi.toFixed(3) : "",
        p.g2 !== undefined ? p.g2.toFixed(3) : "",
        p.p !== undefined ? p.p.toExponential(3) : "",
        p.qValue !== undefined ? p.qValue.toExponential(3) : "",
      ]),
    };
  }

  function buildPartnersTable(): ExportTable {
    const scopeLabel = scopeToParam(scope);
    return {
      slug: `cooccurrence-${selectedRoot ?? "root"}-${scopeLabel.replace(":", "-")}`,
      meta: {
        title: `${t.insightsPage.cooccurrenceHeading}: ${selectedRoot ?? ""}`,
        provenance: [
          { label: "root", value: selectedRoot ?? "" },
          { label: "scope", value: scopeLabel },
          {
            label: "pmi, fdr q-value",
            value:
              "measured over the whole Qur'an (Dunning 1993); do not vary with scope. For a pair's raw G²/p-value, see the top-pairs export.",
          },
        ],
      },
      columns: [
        { key: "partner_root", label: "partner_root" },
        { key: "shared_verses", label: "shared_verses" },
        { key: "pmi_whole_quran", label: "pmi_whole_quran" },
        { key: "fdr_q_value", label: "fdr_q_value" },
      ],
      rows: shownPartners.map((p) => [
        p.root,
        p.count,
        p.pmi !== undefined ? p.pmi.toFixed(3) : "",
        p.qValue !== undefined ? p.qValue.toExponential(3) : "",
      ]),
    };
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.cooccurrenceHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.cooccurrenceDescription}</p>

      <div className="mt-4">
        <ScopeSelector
          scope={scope}
          onChange={setScope}
          meta={meta}
          labels={t.insightsPage.compare}
        />
      </div>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.cooccurrenceLoading}
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
              {t.insightsPage.cooccurrenceTopPairsHeading}
            </h3>
            {scope.kind === "quran" ? (
              <div className="flex w-fit shrink-0 rounded-lg border border-border p-0.5">
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
              <p className="text-xs text-muted">{t.insightsPage.scopedPmiNote}</p>
            )}
          </div>
          {effectiveSortMode === "pmi" && (
            <p className="mt-1.5 text-xs text-muted">
              {t.insightsPage.pmiExplanation} {t.insightsPage.cooccurrenceSigExplanation}
            </p>
          )}
          <div className="mt-2 divide-y divide-border/60">
            {topPairs.slice(0, 15).map((pair, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                <span className="flex items-center gap-2">
                  <Link
                    href={rootHref(pair.rootA)}
                    className="arabic-ui text-accent hover:text-accent-strong"
                  >
                    {pair.rootA}
                  </Link>
                  <span className="text-muted">+</span>
                  <Link
                    href={rootHref(pair.rootB)}
                    className="arabic-ui text-accent hover:text-accent-strong"
                  >
                    {pair.rootB}
                  </Link>
                </span>
                <span className="text-xs text-muted">
                  {t.insightsPage.cooccurrenceSharedVerses(pair.count)}
                  {pair.pmi !== undefined && ` · ${t.insightsPage.pmiLabel(pair.pmi.toFixed(2))}`}
                  {pair.qValue !== undefined && ` · ${t.insightsPage.collocationSigLabel(pair.qValue)}`}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <SaveButton
              id={`view:cooccurrence:pairs:${scopeToParam(scope)}`}
              kind="view"
              label={`${t.insightsPage.cooccurrenceTopPairsHeading}: ${scopeToParam(scope)}`}
              detail={t.insightsPage.cooccurrenceHeading}
              href={`/insights/?tab=cooccurrence&cooccurScope=${scopeToParam(scope)}`}
              compact
            />
            <ExportButton
              path={`/insights/?tab=cooccurrence&cooccurScope=${scopeToParam(scope)}`}
              subject={{ kind: "cooccurrence", label: scopeToParam(scope) }}
              resolve={buildPairsTable}
            />
          </div>

          <div className="mt-6 border-t border-border pt-4">
            {selectedRoot ? (
              <span className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-ink">
                {selectedRoot}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoot(null);
                    setQuery("");
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
                  placeholder={t.insightsPage.cooccurrenceRootPlaceholder}
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

            <div className="mt-4">
              {selectedRoot === null ? (
                <div>
                  <p className="text-sm text-muted">{t.insightsPage.cooccurrencePickPrompt}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted">{t.common.tryLabel}:</span>
                    {COOCCURRENCE_EXAMPLE_ROOTS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRoot(r)}
                        className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              ) : partners.length === 0 ? (
                <p className="text-sm text-muted">{t.insightsPage.cooccurrenceNoResults}</p>
              ) : (
                <>
                  <div className="mb-2 flex justify-end gap-2">
                    <SaveButton
                      id={`view:cooccurrence:${selectedRoot}:${scopeToParam(scope)}`}
                      kind="view"
                      label={`${t.insightsPage.cooccurrenceHeading}: ${selectedRoot}`}
                      detail={scopeToParam(scope)}
                      href={`/insights/?tab=cooccurrence&cooccurRoot=${encodeURIComponent(selectedRoot)}&cooccurScope=${scopeToParam(scope)}`}
                      compact
                    />
                    <ExportButton
                      path={`/insights/?tab=cooccurrence&cooccurRoot=${encodeURIComponent(selectedRoot)}&cooccurScope=${scopeToParam(scope)}`}
                      subject={{ kind: "cooccurrence", label: selectedRoot }}
                      resolve={buildPartnersTable}
                    />
                  </div>
                  {shownPartners.map((p) => (
                    <PartnerBar
                      key={p.root}
                      row={p}
                      values={partnerMetricValues}
                      metric={effectiveSortMode}
                      pmiLabel={t.insightsPage.pmiLabel((p.pmi ?? 0).toFixed(2))}
                      sigLabel={p.qValue !== undefined ? t.insightsPage.collocationSigLabel(p.qValue) : null}
                    />
                  ))}
                  <Link
                    href={rootHref(selectedRoot)}
                    className="mt-2 inline-block text-xs text-accent hover:text-accent-strong"
                  >
                    {selectedRoot} →
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
