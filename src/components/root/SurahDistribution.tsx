import Link from "next/link";

export interface SurahDistributionRow {
  surah: number;
  label: string;
  count: number;
}

export function SurahDistribution({ rows }: { rows: SurahDistributionRow[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-ink">Distribution across surahs</h2>
      <p className="mt-1 text-xs text-muted">Where this root&apos;s occurrences fall across the 114 surahs.</p>

      <div className="mt-4">
        {rows.map((r) => {
          const pct = Math.max((r.count / max) * 100, 2);
          return (
            <Link
              key={r.surah}
              href={`/surah/${r.surah}/`}
              className="group flex items-center gap-3 py-1"
            >
              <div className="w-28 shrink-0 truncate text-xs text-muted group-hover:text-accent sm:w-40">
                {r.surah}. {r.label}
              </div>
              <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
                <div className="h-full rounded bg-accent/70" style={{ width: `${pct}%` }} />
              </div>
              <div className="w-10 shrink-0 text-right text-xs text-muted">{r.count.toLocaleString()}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
