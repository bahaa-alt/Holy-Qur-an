"use client";

import { useState } from "react";
import Link from "next/link";
import { sortByChronologicalOrder } from "@/lib/root/distribution";
import { CHRONOLOGICAL_ORDER_BY_SURAH } from "@/lib/data/chronologicalOrder";
import { useT } from "@/lib/i18n/LanguageContext";

export interface SurahDistributionRow {
  surah: number;
  label: string;
  count: number;
}

type OrderMode = "surah" | "chronological";

export function SurahDistribution({ rows }: { rows: SurahDistributionRow[] }) {
  const t = useT();
  const [order, setOrder] = useState<OrderMode>("surah");
  const max = Math.max(...rows.map((r) => r.count), 1);
  const displayRows = order === "surah" ? rows : sortByChronologicalOrder(rows);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-ink">{t.surahDistribution.heading}</h2>
        <div className="flex rounded-lg border border-border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setOrder("surah")}
            className={`rounded-md px-2.5 py-1 ${order === "surah" ? "bg-accent text-accent-fg" : "text-muted"}`}
          >
            {t.surahDistribution.surahOrder}
          </button>
          <button
            type="button"
            onClick={() => setOrder("chronological")}
            className={`rounded-md px-2.5 py-1 ${order === "chronological" ? "bg-accent text-accent-fg" : "text-muted"}`}
          >
            {t.surahDistribution.revelationOrder}
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">
        {order === "surah" ? t.surahDistribution.bySurahDescription : t.surahDistribution.byRevelationDescription}
      </p>

      <div className="mt-4">
        {displayRows.map((r) => {
          const pct = Math.max((r.count / max) * 100, 2);
          return (
            <Link key={r.surah} href={`/surah/${r.surah}/`} className="group flex items-center gap-3 py-1">
              <div className="w-32 shrink-0 truncate text-xs text-muted group-hover:text-accent sm:w-44">
                {order === "chronological" ? `#${CHRONOLOGICAL_ORDER_BY_SURAH[r.surah - 1]} · ` : `${r.surah}. `}
                {r.label}
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
