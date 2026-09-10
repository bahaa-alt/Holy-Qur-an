"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import { rootHref } from "@/lib/search/suggest";
import type { ComparisonCategoryRow } from "@/lib/compare/buildComparisonRows";

const BAR_OPACITY = ["bg-accent/70", "bg-accent/45", "bg-accent/25"];

export function CompareCategoryBars({
  rows,
  labels,
}: {
  rows: ComparisonCategoryRow[];
  labels: string[];
}) {
  const t = useT();
  const max = Math.max(...rows.flatMap((r) => r.counts), 1);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-ink">{t.compareCategoryBars.heading}</h2>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        {labels.map((label, i) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${BAR_OPACITY[i]}`} />
            {label ? (
              <Link href={rootHref(label)} className="arabic-ui hover:text-accent">
                {label}
              </Link>
            ) : (
              <span className="arabic-ui">{label}</span>
            )}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.cat}>
            <div className="text-xs text-muted">{t.categories[row.cat]}</div>
            <div className="mt-1 space-y-1">
              {row.counts.map((count, i) => {
                const pct = Math.max((count / max) * 100, count > 0 ? 2 : 0);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative h-3 flex-1 overflow-hidden rounded bg-bg">
                      <div className={`h-full rounded ${BAR_OPACITY[i]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-14 shrink-0 text-right text-xs text-muted">{count.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
