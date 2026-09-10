"use client";

import Link from "next/link";

export interface CoverageBarRow {
  key: string;
  href: string | null;
  label: string;
  surahCount: number;
}

/**
 * Ranked bars for "X by how many surahs it appears in" -- bar length is
 * surahCount ÷ totalSurahs, so full coverage reads as a full bar at a
 * glance instead of requiring the reader to parse "94 / 114" as a fraction.
 */
export function CoverageBarList({
  rows,
  totalSurahs,
  everySurahBadge,
}: {
  rows: CoverageBarRow[];
  totalSurahs: number;
  everySurahBadge: string;
}) {
  return (
    <div className="mt-3">
      {rows.map((row) => {
        const pct = Math.max((row.surahCount / totalSurahs) * 100, 2);
        const isFullCoverage = row.surahCount === totalSurahs;
        return (
          <div key={row.key} className="flex items-center gap-3 py-1.5">
            {row.href ? (
              <Link
                href={row.href}
                className="arabic-ui w-28 shrink-0 truncate text-sm text-accent hover:text-accent-strong sm:w-36"
              >
                {row.label}
              </Link>
            ) : (
              <span className="arabic-ui w-28 shrink-0 truncate text-sm text-ink sm:w-36">{row.label}</span>
            )}
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
              <div
                className={`h-full rounded ${isFullCoverage ? "bg-accent" : "bg-accent/60"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex w-28 shrink-0 items-center justify-end gap-1.5 text-end text-xs text-muted">
              {isFullCoverage && <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-accent">{everySurahBadge}</span>}
              <span>
                {row.surahCount} / {totalSurahs}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
