"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getIndex, getVerseRoots } from "@/lib/data/loader";
import { useUrlParam } from "@/lib/hooks/useUrlParam";
import { useT } from "@/lib/i18n/LanguageContext";
import {
  compareScope,
  corpusDispersion,
  perSurahCounts,
  type CompareRow,
} from "@/lib/insights/compare";
import {
  buildVerseRefs,
  scopeFromParam,
  scopeToParam,
  scopeToQcqlFilter,
  type Scope,
} from "@/lib/insights/scope";
import { benjaminiHochberg, bonferroniAlpha, DEFAULT_MIN_COUNT } from "@/lib/stats/keyness";
import { dispersionPermutationTest } from "@/lib/stats/dispersion";
import { DispersionTable, KeynessTable, sigBucket } from "./CompareTables";
import { ScopeSelector } from "./ScopeSelector";
import { ExportButton } from "@/components/export/ExportButton";
import { SaveButton } from "@/components/notes/SaveButton";
import type { ExportTable } from "@/lib/export/table";
import type { IndexFile, MetaFile, VerseRootsFile } from "@/lib/data/types";

const SCOPE_PARAM = "scope";
const ROWS_SHOWN = 40;
const MIN_COUNTS = [1, 3, 5, 10, 20] as const;
/**
 * Dispersion needs its own, higher floor. DP asks whether a word spread
 * out, and a word occurring five times never had the chance: at the
 * keyness floor the table fills with rare words that are "concentrated"
 * only because they are rare. Frequency is the precondition for the
 * question, so the control offers frequencies where it is meaningful.
 */
const DISPERSION_MIN_COUNTS = [10, 25, 50, 100] as const;

const PILL = (active: boolean) =>
  `rounded-md px-2.5 py-1 text-xs ${active ? "bg-accent text-accent-fg" : "text-muted hover:text-ink"}`;
const SELECT =
  "rounded-md border border-border bg-bg px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none";

/**
 * Compare: what is characteristic of THIS part of the Qur'an?
 *
 * This replaces two of the old tabs -- "coverage" (a top-15 list of roots
 * by how many surahs they touch) and "distinctive vocabulary" (per-surah,
 * ranked by rate ratio). Both were fixed leaderboards over a fixed scope;
 * neither could say whether a difference was bigger than chance.
 *
 * Here the reader picks the scope, everything is measured against the rest
 * of the corpus, and each row carries a significance measure (G²), an
 * effect size (log ratio) and a link to the evidence. See lib/stats for
 * the measures and lib/insights for the engine -- both are computed in the
 * browser from verse-roots.json, which the app already ships.
 */
export function CompareTab({ meta }: { meta: MetaFile }) {
  const t = useT();
  // Restore a shared scope before the first compute, so a link opens on
  // the comparison it names rather than flashing the default -- the
  // pattern this tool introduced, now shared as useUrlParam so Rhyme and
  // Collocations' own scope (and the page's own tab) do not reinvent it.
  const [scope, setScope] = useUrlParam<Scope>(
    SCOPE_PARAM,
    { kind: "revelation", value: "medinan" },
    scopeFromParam,
    scopeToParam,
  );
  const [minCount, setMinCount] = useState<number>(DEFAULT_MIN_COUNT);
  const [direction, setDirection] = useState<"over" | "under">("over");
  const [correctionMethod, setCorrectionMethod] = useState<"bonferroni" | "fdr">("bonferroni");
  const [spread, setSpread] = useState<"even" | "concentrated">("concentrated");
  const [dispersionMin, setDispersionMin] = useState<number>(25);
  const [data, setData] = useState<{ verseRoots: VerseRootsFile; index: IndexFile } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getVerseRoots(), getIndex()]).then(([verseRoots, index]) => {
      if (!cancelled) setData({ verseRoots, index });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refs = useMemo(() => buildVerseRefs(meta), [meta]);
  const rootNames = useMemo(() => data?.index.roots.map((r) => r.ar) ?? [], [data]);

  const result = useMemo(
    () =>
      data ? compareScope(data.verseRoots, refs, scope, data.index.roots.length, minCount) : null,
    [data, refs, scope, minCount],
  );

  // Only meaningful at whole-Qur'an scope, where there is no reference to
  // compare against -- so the question becomes "how is this word spread"
  // rather than "is it over-used here".
  const dispersionRows = useMemo(() => {
    if (!data || scope.kind !== "quran") return null;
    const rows = corpusDispersion(data.verseRoots, refs, data.index.roots.length).filter(
      (r) => r.dispersion.total >= dispersionMin,
    );
    rows.sort((a, b) =>
      spread === "even" ? a.dispersion.dp - b.dispersion.dp : b.dispersion.dp - a.dispersion.dp,
    );
    return rows;
  }, [data, refs, scope.kind, dispersionMin, spread]);

  const shownRows: CompareRow[] = useMemo(() => {
    if (!result) return [];
    return result.rows
      .filter((r) => (direction === "over" ? r.keyness.overused : !r.keyness.overused))
      .slice(0, ROWS_SHOWN);
  }, [result, direction]);

  // FDR (Benjamini-Hochberg), computed over every root meeting the
  // minimum-occurrence floor (result.rows, both directions, unsliced) --
  // not just the 40 shown -- so restricting to the most extreme p-values
  // ahead of time can't bias which ones the correction calls significant.
  // A different family than Bonferroni's `tested` (every root that
  // occurs at all): see correctionNote/fdrCorrectionNote for why that
  // is a deliberate, disclosed choice rather than an inconsistency.
  const fdr = useMemo(
    () => (result && result.rows.length > 0 ? benjaminiHochberg(result.rows.map((r) => r.keyness.p)) : null),
    [result],
  );
  const qValueByRootIdx = useMemo(() => {
    if (!result || !fdr) return new Map<number, number>();
    return new Map(result.rows.map((r, i) => [r.rootIdx, fdr.qValues[i]]));
  }, [result, fdr]);

  const correctedAlpha =
    correctionMethod === "bonferroni" ? bonferroniAlpha(result?.tested ?? 1) : (fdr?.thresholdP ?? 0);

  const scopeFilter = scopeToQcqlFilter(scope);
  const queryFor = (rootAr: string) =>
    scopeFilter === null
      ? null
      : scopeFilter === ""
        ? `[root=${rootAr}]`
        : `[root=${rootAr}] :: ${scopeFilter}`;

  /**
   * The visible table as a portable, self-describing export.
   *
   * Built through the shared exporter rather than the bespoke CSV this
   * tool shipped with, so a keyness table carries the same provenance
   * header -- query, scope, dataset hash, citation -- as every other
   * export in the app, and there is one answer to "what does an export
   * from this app look like".
   */
  function buildTable(): ExportTable {
    const scopeLabel = scopeToParam(scope);
    if (scope.kind === "quran" && dispersionRows) {
      return {
        slug: "dispersion-quran",
        meta: {
          title: c.dispersionHeading,
          provenance: [
            { label: "measure", value: "Gries DP over 114 surahs" },
            { label: "minimum occurrences", value: String(dispersionMin) },
            { label: "sorted by", value: spread === "even" ? "most even" : "most concentrated" },
          ],
        },
        columns: [
          { key: "root", label: "root" },
          { key: "count", label: "count" },
          { key: "surahs", label: "surahs" },
          { key: "dp", label: "dp" },
          { key: "dp_norm", label: "dp_norm" },
        ],
        rows: dispersionRows
          .slice(0, ROWS_SHOWN)
          .map((r) => [
            rootNames[r.rootIdx],
            r.dispersion.total,
            r.dispersion.range,
            r.dispersion.dp.toFixed(4),
            r.dispersion.dpNorm.toFixed(4),
          ]),
      };
    }
    return {
      slug: `keyness-${scopeLabel.replace(":", "-")}`,
      meta: {
        title: `${direction === "over" ? c.keynessHeadingOver : c.keynessHeadingUnder}`,
        provenance: [
          { label: "scope", value: scopeLabel },
          { label: "reference", value: "the rest of the Qur'an" },
          {
            label: "measures",
            value:
              "log-likelihood G² (Dunning 1993), log ratio (Hardie 2014), 95% Wilson score interval (Wilson 1927)",
          },
          { label: "minimum occurrences", value: String(minCount) },
          { label: "roots tested (Bonferroni family)", value: String(result?.tested ?? 0) },
          { label: "roots above the floor (FDR family)", value: String(result?.rows.length ?? 0) },
          { label: "scope tokens", value: String(result?.scopeTokens ?? 0) },
          { label: "reference tokens", value: String(result?.referenceTokens ?? 0) },
          {
            label: "active correction",
            value:
              correctionMethod === "bonferroni"
                ? `Bonferroni, alpha=${correctedAlpha.toExponential(3)}`
                : `Benjamini-Hochberg FDR, threshold p=${correctedAlpha.toExponential(3)}`,
          },
        ],
      },
      columns: [
        { key: "root", label: "root" },
        { key: "count_in_scope", label: "count_in_scope" },
        { key: "count_elsewhere", label: "count_elsewhere" },
        { key: "per_10k_in_scope", label: "per_10k_in_scope" },
        { key: "per_10k_in_scope_ci_low", label: "per_10k_in_scope_ci_low" },
        { key: "per_10k_in_scope_ci_high", label: "per_10k_in_scope_ci_high" },
        { key: "per_10k_elsewhere", label: "per_10k_elsewhere" },
        { key: "per_10k_elsewhere_ci_low", label: "per_10k_elsewhere_ci_low" },
        { key: "per_10k_elsewhere_ci_high", label: "per_10k_elsewhere_ci_high" },
        { key: "log_ratio", label: "log_ratio" },
        { key: "log_ratio_estimated", label: "log_ratio_estimated" },
        { key: "log_likelihood_g2", label: "log_likelihood_g2" },
        { key: "p_value", label: "p_value" },
        { key: "fdr_q_value", label: "fdr_q_value" },
      ],
      rows: shownRows.map((r) => [
        rootNames[r.rootIdx],
        r.count,
        r.referenceCount,
        r.keyness.rate.toFixed(2),
        r.keyness.rateCI.low.toFixed(2),
        r.keyness.rateCI.high.toFixed(2),
        r.keyness.referenceRate.toFixed(2),
        r.keyness.referenceRateCI.low.toFixed(2),
        r.keyness.referenceRateCI.high.toFixed(2),
        r.keyness.logRatio.toFixed(4),
        r.keyness.logRatioEstimated ? "yes" : "no",
        r.keyness.g2.toFixed(3),
        r.keyness.p.toExponential(3),
        (qValueByRootIdx.get(r.rootIdx) ?? 1).toExponential(3),
      ]),
    };
  }

  function testDispersionSignificance(rootIdx: number) {
    const { counts, sizes } = perSurahCounts(data!.verseRoots, refs, rootIdx, meta.surahs.length);
    return dispersionPermutationTest(counts, sizes);
  }

  const c = t.insightsPage.compare;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">{c.heading}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{c.intro}</p>

        {/* --- scope --- */}
        <div className="mt-4">
          <ScopeSelector scope={scope} onChange={setScope} meta={meta} labels={c} />
        </div>

        {/* --- controls --- */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
          <label className="flex items-center gap-1.5">
            {c.minCount}
            {scope.kind === "quran" ? (
              <select
                className={SELECT}
                value={dispersionMin}
                onChange={(e) => setDispersionMin(Number(e.target.value))}
              >
                {DISPERSION_MIN_COUNTS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className={SELECT}
                value={minCount}
                onChange={(e) => setMinCount(Number(e.target.value))}
              >
                {MIN_COUNTS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            )}
          </label>

          {scope.kind === "quran" ? (
            <div className="flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                className={PILL(spread === "concentrated")}
                onClick={() => setSpread("concentrated")}
              >
                {c.sortConcentrated}
              </button>
              <button
                type="button"
                className={PILL(spread === "even")}
                onClick={() => setSpread("even")}
              >
                {c.sortEven}
              </button>
            </div>
          ) : (
            <div className="flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                className={PILL(direction === "over")}
                onClick={() => setDirection("over")}
              >
                {c.showOver}
              </button>
              <button
                type="button"
                className={PILL(direction === "under")}
                onClick={() => setDirection("under")}
              >
                {c.showUnder}
              </button>
            </div>
          )}

          {scope.kind !== "quran" && (
            <label className="flex items-center gap-1.5">
              {c.correctionMethodLabel}
              <div className="flex rounded-lg border border-border p-0.5">
                <button
                  type="button"
                  className={PILL(correctionMethod === "bonferroni")}
                  onClick={() => setCorrectionMethod("bonferroni")}
                >
                  {c.correctionBonferroni}
                </button>
                <button
                  type="button"
                  className={PILL(correctionMethod === "fdr")}
                  onClick={() => setCorrectionMethod("fdr")}
                >
                  {c.correctionFdr}
                </button>
              </div>
            </label>
          )}

          <SaveButton
            id={`view:compare:${scopeToParam(scope)}`}
            kind="view"
            label={`${c.tab}: ${scopeToParam(scope)}`}
            detail={c.heading}
            href={`/insights/?${SCOPE_PARAM}=${scopeToParam(scope)}`}
            compact
          />
          {data && (
            <ExportButton
              path={`/insights/?${SCOPE_PARAM}=${scopeToParam(scope)}`}
              subject={{ kind: "keyness", label: scopeToParam(scope) }}
              resolve={buildTable}
            />
          )}
        </div>
      </div>

      {/* --- results --- */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        {!data || !result ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={14} className="animate-spin" />
            {c.loading}
          </p>
        ) : scope.kind === "quran" && dispersionRows ? (
          <>
            <h3 className="text-sm font-medium text-ink">{c.dispersionHeading}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">{c.dispersionIntro}</p>
            <div className="mt-3">
              <DispersionTable
                rows={dispersionRows.slice(0, ROWS_SHOWN)}
                rootNames={rootNames}
                onTestSignificance={testDispersionSignificance}
              />
            </div>
          </>
        ) : (
          <>
            <h3 className="text-sm font-medium text-ink">
              {direction === "over" ? c.keynessHeadingOver : c.keynessHeadingUnder}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {c.summary(result.scopeVerses, result.scopeTokens, result.referenceTokens)}
            </p>
            {shownRows.length === 0 ? (
              <p className="mt-3 text-sm text-muted">{c.noRows}</p>
            ) : (
              <>
                <div className="mt-3">
                  <KeynessTable
                    rows={shownRows}
                    rootNames={rootNames}
                    correctedAlpha={correctedAlpha}
                    queryFor={queryFor}
                  />
                </div>
                <p className="mt-3 text-xs text-muted">
                  {correctionMethod === "bonferroni"
                    ? c.correctionNote(result.tested, correctedAlpha.toExponential(1))
                    : c.fdrCorrectionNote(result.rows.length, correctedAlpha.toExponential(1))}
                  {shownRows.some((r) => sigBucket(r.keyness.p, correctedAlpha) === "ns") &&
                    ` ${c.nsNote}`}
                </p>
              </>
            )}
          </>
        )}
      </div>

      {/* --- how to read it: the difference between a tool and a toy --- */}
      <div className="space-y-2 rounded-2xl border border-border bg-surface p-6 text-xs leading-relaxed text-muted">
        <h3 className="text-sm font-medium text-ink">{c.methodsHeading}</h3>
        <p>{c.methodsBasis}</p>
        <p>{c.methodsG2}</p>
        <p>{c.methodsLogRatio}</p>
        <p>{c.methodsCI}</p>
        <p>{c.methodsCorrection}</p>
        <p>{c.methodsDp}</p>
        <p>{c.methodsPermutation}</p>
        <p>{c.methodsLimits}</p>
      </div>
    </div>
  );
}
