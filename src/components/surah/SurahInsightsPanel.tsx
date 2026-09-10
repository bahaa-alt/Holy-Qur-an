"use client";

import Link from "next/link";
import { rootHref } from "@/lib/search/suggest";
import { useT } from "@/lib/i18n/LanguageContext";
import type { DistinctiveRootRow } from "@/lib/data/types";

function DistinctiveRootChip({ row }: { row: DistinctiveRootRow }) {
  const t = useT();
  return (
    <Link
      href={rootHref(row.ar)}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:border-accent"
      title={row.glossShort}
    >
      <span className="arabic-ui text-ink">{row.ar}</span>
      <span className="text-xs text-muted">{t.insightsPage.vocabRatio(row.ratio.toFixed(1))}</span>
    </Link>
  );
}

/**
 * A compact "this surah at a glance" panel, built from data the pipeline
 * already computes for the whole corpus (distinctive vocabulary, rhyme
 * endings, Abjad totals) but slices down to just this one surah -- so a
 * reader lands on a surah page with more context than a bare verse list,
 * without needing to visit /insights/ separately for it.
 */
export function SurahInsightsPanel({
  distinctiveRoots,
  rhymeDominant,
  rhymeTotalVerses,
  abjadTotal,
}: {
  distinctiveRoots: DistinctiveRootRow[];
  rhymeDominant: { letter: string; count: number } | null;
  rhymeTotalVerses: number;
  abjadTotal: number;
}) {
  const t = useT();

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-ink">{t.surahInsights.heading}</h2>

      <div className="mt-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
          {t.surahInsights.distinctiveVocabHeading}
        </h3>
        {distinctiveRoots.length === 0 ? (
          <p className="mt-1.5 text-sm text-muted">{t.surahInsights.distinctiveVocabEmpty}</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {distinctiveRoots.map((row) => (
              <DistinctiveRootChip key={row.ar} row={row} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted">{t.surahInsights.rhymeHeading}</h3>
          <p className="mt-1.5 text-sm text-ink">
            {rhymeDominant ? (
              <>
                <bdi className="arabic-ui">{rhymeDominant.letter}</bdi>{" "}
                {t.surahInsights.rhymeSummary(rhymeDominant.count, rhymeTotalVerses)}
              </>
            ) : (
              t.surahInsights.rhymeEmpty
            )}
          </p>
        </div>
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted">{t.surahInsights.abjadHeading}</h3>
          <p className="mt-1.5 text-sm text-ink">{t.surahInsights.abjadValue(abjadTotal)}</p>
        </div>
      </div>

      <Link href="/insights/" className="mt-4 inline-block text-xs text-accent hover:text-accent-strong">
        {t.surahInsights.viewMoreInInsights}
      </Link>
    </div>
  );
}
