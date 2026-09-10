"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getFormulas } from "@/lib/data/loader";
import { useT } from "@/lib/i18n/LanguageContext";
import type { FormulaRow, FormulasFile } from "@/lib/data/types";

const LENGTHS = [3, 4, 5, 6] as const;
const LENGTH_PILL_CLASS = (active: boolean) => `rounded-md px-3 py-1.5 ${active ? "bg-accent text-accent-fg" : "text-muted"}`;

function PhraseRow({
  row,
  max,
  selected,
  onSelect,
}: {
  row: FormulaRow;
  max: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const pct = Math.max((row.count / max) * 100, 2);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`block w-full rounded-lg px-2 py-1.5 text-start transition-colors ${selected ? "bg-accent/10" : "hover:bg-bg"}`}
    >
      <div className="flex items-center gap-3">
        <div className="arabic-ui min-w-0 flex-1 truncate text-sm text-ink">{row.display}</div>
        <div className="relative h-5 w-24 shrink-0 overflow-hidden rounded bg-bg">
          <div className="h-full rounded bg-accent/70" style={{ width: `${pct}%` }} />
        </div>
        <div className="w-14 shrink-0 text-end text-xs text-muted">{row.count.toLocaleString()}</div>
      </div>
    </button>
  );
}

export function FormulasTab() {
  const t = useT();
  const [formulas, setFormulas] = useState<FormulasFile | null>(null);
  const [length, setLength] = useState<number>(3);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

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
  const selectedRow = rows.find((r) => r.phraseKey === selectedKey) ?? null;

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
                onClick={() => {
                  setLength(n);
                  setSelectedKey(null);
                }}
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
                  row={row}
                  max={max}
                  selected={row.phraseKey === selectedKey}
                  onSelect={() => setSelectedKey((prev) => (prev === row.phraseKey ? null : row.phraseKey))}
                />
              ))
            )}
          </div>

          {selectedRow && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm text-muted">
                {t.insightsPage.formulasOccurrencesCount(selectedRow.count)}
                {selectedRow.count > selectedRow.refs.length
                  ? ` · ${t.insightsPage.formulasShowingFirstRefs(selectedRow.refs.length)}`
                  : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedRow.refs.map((ref) => (
                  <Link
                    key={`${ref.s}:${ref.a}`}
                    href={`/surah/${ref.s}/?ayah=${ref.a}`}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-accent hover:border-accent"
                  >
                    <bdi>
                      {ref.s}:{ref.a}
                    </bdi>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
