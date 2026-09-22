"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { rootHref } from "@/lib/search/suggest";
import { useT } from "@/lib/i18n/LanguageContext";
import type { CompareRow, DispersionRow } from "@/lib/insights/compare";
import type { PermutationTestResult } from "@/lib/stats/dispersion";

/**
 * The two tables the comparison tool renders. Presentational only -- what
 * to compute and against what lives in CompareTab and lib/insights.
 */

/** Which significance bucket a row falls in, including the corrected one. */
export type SigBucket = "corrected" | "p001" | "p01" | "p05" | "ns";

export function sigBucket(p: number, correctedAlpha: number): SigBucket {
  if (p < correctedAlpha) return "corrected";
  if (p < 0.001) return "p001";
  if (p < 0.01) return "p01";
  if (p < 0.05) return "p05";
  return "ns";
}

function SigCell({ bucket }: { bucket: SigBucket }) {
  const t = useT();
  const label = t.insightsPage.compare.sig[bucket];
  const strong = bucket === "corrected" || bucket === "p001";
  return (
    <span className={strong ? "font-medium text-ink" : "text-muted"} dir="ltr">
      {label}
    </span>
  );
}

const TH = "px-2 py-1.5 text-start text-xs font-medium text-muted";
const TD = "px-2 py-1.5 text-sm text-ink";
const NUM = `${TD} tabular-nums`;

export function KeynessTable({
  rows,
  rootNames,
  correctedAlpha,
  queryFor,
}: {
  rows: CompareRow[];
  rootNames: readonly string[];
  correctedAlpha: number;
  /** the QCQL that reproduces this row, when the scope can be expressed */
  queryFor: (rootAr: string) => string | null;
}) {
  const t = useT();
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className={TH}>{t.insightsPage.compare.colRoot}</th>
            <th className={TH}>{t.insightsPage.compare.colCount}</th>
            <th className={TH} title={t.insightsPage.compare.colRateCIHint}>
              {t.insightsPage.compare.colHere}
            </th>
            <th className={TH} title={t.insightsPage.compare.colRateCIHint}>
              {t.insightsPage.compare.colElsewhere}
            </th>
            <th className={TH} title={t.insightsPage.compare.colLogRatioCIHint}>
              {t.insightsPage.compare.colLogRatio}
            </th>
            <th className={TH}>{t.insightsPage.compare.colG2}</th>
            <th className={TH}>{t.insightsPage.compare.colSig}</th>
            <th className={TH} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ar = rootNames[row.rootIdx] ?? "";
            const k = row.keyness;
            const query = queryFor(ar);
            return (
              <tr key={row.rootIdx} className="border-b border-border/60">
                <td className={TD}>
                  <Link
                    href={rootHref(ar)}
                    className="arabic-ui text-accent hover:text-accent-strong"
                  >
                    {ar}
                  </Link>
                </td>
                <td className={NUM}>{row.count.toLocaleString()}</td>
                <td className={NUM}>
                  {k.rate.toFixed(1)}
                  <div className="text-[10px] font-normal text-muted/70" dir="ltr">
                    {k.rateCI.low.toFixed(1)}–{k.rateCI.high.toFixed(1)}
                  </div>
                </td>
                <td className={NUM}>
                  {k.referenceRate.toFixed(1)}
                  <div className="text-[10px] font-normal text-muted/70" dir="ltr">
                    {k.referenceRateCI.low.toFixed(1)}–{k.referenceRateCI.high.toFixed(1)}
                  </div>
                </td>
                <td className={NUM} dir="ltr">
                  <span className={k.overused ? "text-ink" : "text-muted"}>
                    {k.logRatio > 0 ? "+" : ""}
                    {k.logRatio.toFixed(2)}
                  </span>
                  {/* An effect size computed from a floored zero is an
                      estimate, and says so rather than pretending. */}
                  {k.logRatioEstimated && (
                    <span title={t.insightsPage.compare.estimatedNote} className="text-muted">
                      {" †"}
                    </span>
                  )}
                  <div className="text-[10px] font-normal text-muted/70">
                    {k.logRatioCI.low > 0 ? "+" : ""}
                    {k.logRatioCI.low.toFixed(2)}–{k.logRatioCI.high > 0 ? "+" : ""}
                    {k.logRatioCI.high.toFixed(2)}
                  </div>
                </td>
                <td className={NUM}>{k.g2.toFixed(1)}</td>
                <td className={`${TD} whitespace-nowrap`}>
                  <SigCell bucket={sigBucket(k.p, correctedAlpha)} />
                </td>
                <td className={TD}>
                  {query && (
                    <Link
                      href={`/query/?q=${encodeURIComponent(query)}`}
                      className="whitespace-nowrap font-mono text-xs text-accent hover:text-accent-strong"
                      dir="ltr"
                      title={t.insightsPage.compare.openInQuery}
                    >
                      →
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** One row's on-demand significance state: not yet asked, computing, or a result. */
type SigState = { status: "idle" } | { status: "loading" } | { status: "done"; result: PermutationTestResult };

export function DispersionTable({
  rows,
  rootNames,
  onTestSignificance,
}: {
  rows: DispersionRow[];
  rootNames: readonly string[];
  /**
   * Runs the permutation test for one root and returns synchronously --
   * it reads verse-roots.json fresh for just that root (see
   * lib/insights/compare.ts's perSurahCounts), so it is deliberately not
   * run for all rows up front the way DP itself is.
   */
  onTestSignificance: (rootIdx: number) => PermutationTestResult;
}) {
  const t = useT();
  const [sig, setSig] = useState<Record<number, SigState>>({});

  function runTest(rootIdx: number) {
    setSig((prev) => ({ ...prev, [rootIdx]: { status: "loading" } }));
    // Synchronous, but deferred a tick so the "computing" state actually
    // paints first -- the largest roots' permutation test can take long
    // enough to be worth showing, and setState alone wouldn't flush
    // before the blocking computation below runs on the same turn.
    setTimeout(() => {
      const result = onTestSignificance(rootIdx);
      setSig((prev) => ({ ...prev, [rootIdx]: { status: "done", result } }));
    }, 0);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className={TH}>{t.insightsPage.compare.colRoot}</th>
            <th className={TH}>{t.insightsPage.compare.colCount}</th>
            <th className={TH}>{t.insightsPage.compare.colRange}</th>
            <th className={TH}>{t.insightsPage.compare.colDp}</th>
            <th className={TH}>{t.insightsPage.compare.colSpread}</th>
            <th className={TH} title={t.insightsPage.compare.colSignificanceHint}>
              {t.insightsPage.compare.colSignificance}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ar = rootNames[row.rootIdx] ?? "";
            const d = row.dispersion;
            const state = sig[row.rootIdx] ?? { status: "idle" };
            return (
              <tr key={row.rootIdx} className="border-b border-border/60">
                <td className={TD}>
                  <Link
                    href={rootHref(ar)}
                    className="arabic-ui text-accent hover:text-accent-strong"
                  >
                    {ar}
                  </Link>
                </td>
                <td className={NUM}>{d.total.toLocaleString()}</td>
                <td className={NUM}>{d.range}</td>
                <td className={NUM}>{d.dp.toFixed(3)}</td>
                <td className={`${TD} w-40`}>
                  {/* The bar reads left-to-right as "more concentrated",
                      which is the direction DP itself runs. */}
                  <div className="h-2 w-full overflow-hidden rounded bg-bg" dir="ltr">
                    <div
                      className="h-full rounded bg-accent/70"
                      style={{ width: `${Math.max(d.dpNorm * 100, 1)}%` }}
                    />
                  </div>
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  {state.status === "idle" && (
                    <button
                      type="button"
                      onClick={() => runTest(row.rootIdx)}
                      className="text-xs text-accent hover:text-accent-strong"
                    >
                      {t.insightsPage.compare.testSignificance}
                    </button>
                  )}
                  {state.status === "loading" && (
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Loader2 size={12} className="animate-spin" />
                      {t.insightsPage.compare.testingSignificance}
                    </span>
                  )}
                  {state.status === "done" && (
                    <span className="text-xs text-ink" dir="ltr">
                      {t.insightsPage.compare.significanceResult(
                        state.result.p,
                        state.result.permutations,
                      )}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
