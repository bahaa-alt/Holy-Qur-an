"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getFormulas } from "@/lib/data/loader";
import { formulaHref } from "@/lib/search/suggest";
import { useT } from "@/lib/i18n/LanguageContext";
import type { FormulaRow, FormulasFile } from "@/lib/data/types";

const LENGTHS = [2, 3, 4, 5, 6] as const;
const LENGTH_PILL_CLASS = (active: boolean) => `rounded-md px-3 py-1.5 ${active ? "bg-accent text-accent-fg" : "text-muted"}`;

function PhraseRow({ length, row, max, occurrencesLabel }: { length: number; row: FormulaRow; max: number; occurrencesLabel: string }) {
  const pct = Math.max((row.count / max) * 100, 2);
  return (
    <Link
      href={formulaHref(length, row.phraseKey)}
      className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-bg"
      title={occurrencesLabel}
    >
      <div className="flex items-center gap-3">
        <div className="arabic-ui min-w-0 flex-1 truncate text-sm text-ink">{row.display}</div>
        <div className="relative h-5 w-24 shrink-0 overflow-hidden rounded bg-bg">
          <div className="h-full rounded bg-accent/70" style={{ width: `${pct}%` }} />
        </div>
        <div className="w-14 shrink-0 text-end text-xs text-muted">{row.count.toLocaleString()}</div>
      </div>
    </Link>
  );
}

export function FormulasTab() {
  const t = useT();
  const [formulas, setFormulas] = useState<FormulasFile | null>(null);
  const [length, setLength] = useState<number>(3);

  useEffect(() => {
    let cancelled = false;
    getFormulas().then((f) => {
      if (!cancelled) setFormulas(f);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = formulas?.lengths.find((g) => g.length === length)?.rows ?? [];
  const max = rows.length > 0 ? Math.max(...rows.map((r) => r.count)) : 1;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.formulasHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.formulasDescription}</p>

      {!formulas ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.formulasLoading}
        </p>
      ) : (
        <>
          <div className="mt-4 flex w-fit flex-wrap rounded-lg border border-border p-0.5 text-sm">
            {LENGTHS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLength(n)}
                className={LENGTH_PILL_CLASS(length === n)}
              >
                {t.insightsPage.formulasWordsLength(n)}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-0.5">
            {rows.length === 0 ? (
              <p className="text-sm text-muted">{t.insightsPage.formulasNoResults}</p>
            ) : (
              rows.map((row) => (
                <PhraseRow
                  key={row.phraseKey}
                  length={length}
                  row={row}
                  max={max}
                  occurrencesLabel={t.insightsPage.formulasOccurrencesCount(row.count)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
