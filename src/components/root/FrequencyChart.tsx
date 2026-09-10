"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import { wordHref } from "@/lib/search/suggest";
import type { CategoryCount, LemmaCount } from "@/lib/root/summary";

function Bar({
  label,
  count,
  max,
  sublabel,
  arabic,
  href,
}: {
  label: string;
  count: number;
  max: number;
  sublabel?: string;
  arabic?: boolean;
  href?: string;
}) {
  const pct = max > 0 ? Math.max((count / max) * 100, 2) : 0;
  const labelClass = `w-28 shrink-0 truncate text-xs text-muted sm:w-40 ${arabic ? "arabic-ui text-sm" : ""}`;
  return (
    <div className="flex items-center gap-3 py-1">
      {href ? (
        <Link href={href} className={`${labelClass} hover:text-accent`}>
          {label}
        </Link>
      ) : (
        <div className={labelClass}>{label}</div>
      )}
      <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
        <div className="h-full rounded bg-accent/70" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-24 shrink-0 truncate text-right text-xs text-muted">
        {count.toLocaleString()}
        {sublabel ? ` · ${sublabel}` : ""}
      </div>
    </div>
  );
}

export function FrequencyChart({
  byCategory,
  byLemma,
}: {
  byCategory: CategoryCount[];
  byLemma: LemmaCount[];
}) {
  const t = useT();
  const [view, setView] = useState<"category" | "lemma">("category");
  const maxCategory = Math.max(...byCategory.map((c) => c.count), 1);
  const maxLemma = Math.max(...byLemma.map((l) => l.count), 1);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink">{t.frequencyChart.heading}</h2>
        <div className="flex rounded-lg border border-border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setView("category")}
            className={`rounded-md px-2.5 py-1 ${view === "category" ? "bg-accent text-accent-fg" : "text-muted"}`}
          >
            {t.frequencyChart.byCategory}
          </button>
          <button
            type="button"
            onClick={() => setView("lemma")}
            className={`rounded-md px-2.5 py-1 ${view === "lemma" ? "bg-accent text-accent-fg" : "text-muted"}`}
          >
            {t.frequencyChart.byLemma}
          </button>
        </div>
      </div>

      <div className="mt-4">
        {view === "category"
          ? byCategory.map((c) => (
              <Bar key={c.cat} label={t.categories[c.cat]} count={c.count} max={maxCategory} />
            ))
          : byLemma
              .slice(0, 12)
              .map((l) => (
                <Bar
                  key={l.key}
                  label={l.lemma}
                  count={l.count}
                  max={maxLemma}
                  sublabel={t.categories[l.cat]}
                  arabic
                  href={wordHref(l.wordIdx)}
                />
              ))}
      </div>
    </div>
  );
}
