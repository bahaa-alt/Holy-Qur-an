"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import type { LetterCount } from "@/lib/arabic/letterFrequency";

/** One ranked row: label, proportional bar (relative to the set's max, not its total), and value -- same anatomy as FrequencyChart's Bar. */
function Bar({
  letter,
  count,
  max,
  pct,
  selected,
  onSelect,
}: {
  letter: string;
  count: number;
  max: number;
  pct: number;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const barPct = max > 0 ? Math.max((count / max) * 100, 2) : 0;
  const row = (
    <>
      <div className="arabic-ui w-8 shrink-0 text-center text-lg text-ink">{letter}</div>
      <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
        <div className={`h-full rounded ${selected ? "bg-accent" : "bg-accent/70"}`} style={{ width: `${barPct}%` }} />
      </div>
      <div className="w-28 shrink-0 text-end text-xs text-muted">
        {count.toLocaleString()} · {pct.toFixed(1)}%
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center gap-3 rounded py-1 transition-colors ${selected ? "bg-accent/10" : "hover:bg-bg"}`}
      >
        {row}
      </button>
    );
  }
  return <div className="flex items-center gap-3 py-1">{row}</div>;
}

export function LetterFrequencyTable({
  rows,
  selectedLetter,
  onSelectLetter,
}: {
  rows: LetterCount[];
  /** when provided, rows become clickable and the selected one is highlighted */
  selectedLetter?: string | null;
  onSelectLetter?: (letter: string) => void;
}) {
  const t = useT();

  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-muted">{t.insightsPage.noLetters}</p>;
  }

  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const max = rows[0].count;

  return (
    <div className="mt-4">
      {rows.map((r) => (
        <Bar
          key={r.letter}
          letter={r.letter}
          count={r.count}
          max={max}
          pct={(r.count / total) * 100}
          selected={selectedLetter === r.letter}
          onSelect={onSelectLetter ? () => onSelectLetter(r.letter) : undefined}
        />
      ))}
    </div>
  );
}
