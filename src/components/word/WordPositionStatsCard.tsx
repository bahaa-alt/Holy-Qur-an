"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import type { WordPositionStats } from "@/lib/word/positionStats";

function pct(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

function StatBlock({ label, count, total }: { label: string; count: number; total: number }) {
  const t = useT();
  return (
    <div className="rounded-xl border border-border bg-bg p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-ink">{count.toLocaleString()}</p>
      <p className="text-xs text-muted">{t.wordPositionStats.percentOfOccurrences(pct(count, total))}</p>
    </div>
  );
}

/**
 * Presentational only: the server-rendered word page already has this
 * lemma's full occurrence list (from buildOccurrenceRows/filterRows) and
 * every touched verse's word count (from readSurahFile), so
 * buildWordPositionStats() runs once at build time and the result is
 * passed in as a plain prop -- no client fetch needed.
 */
export function WordPositionStatsCard({ stats }: { stats: WordPositionStats }) {
  const t = useT();

  if (stats.total === 0) return null;

  const maxPositionCount = Math.max(...stats.positions.map((p) => p.count), 1);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.wordPositionStats.heading}</h2>
      <p className="mt-1 text-sm text-muted">{t.wordPositionStats.description}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatBlock label={t.wordPositionStats.startsVerse} count={stats.startCount} total={stats.total} />
        <StatBlock label={t.wordPositionStats.withinVerse} count={stats.middleCount} total={stats.total} />
        <StatBlock label={t.wordPositionStats.endsVerse} count={stats.endCount} total={stats.total} />
      </div>

      <h3 className="mt-6 text-xs font-medium uppercase tracking-wide text-muted">{t.wordPositionStats.byPositionHeading}</h3>
      <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto pe-1">
        {stats.positions.map((p) => (
          <div key={p.position} className="flex items-center gap-3">
            <div className="w-20 shrink-0 text-end text-xs text-muted">{t.wordPositionStats.positionLabel(p.position)}</div>
            <div className="relative h-4 flex-1 overflow-hidden rounded bg-bg">
              <div className="h-full rounded bg-accent/70" style={{ width: `${(p.count / maxPositionCount) * 100}%` }} />
            </div>
            <div className="w-10 shrink-0 text-end text-xs text-muted">{p.count.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
