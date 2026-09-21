"use client";

import { JUZ_COUNT } from "@/lib/quran/juz";
import type { Scope } from "@/lib/insights/scope";
import type { MetaFile } from "@/lib/data/types";

/** The scope vocabulary, defined once on Compare -- which had it first --
 *  and reused by any tool that now shares the concept. */
export interface ScopeLabels {
  scopeLabel: string;
  scopeQuran: string;
  scopeMeccan: string;
  scopeMedinan: string;
  scopeSurah: string;
  scopeJuz: string;
  scopeChrono: string;
  juzLabel: (n: number) => string;
  chronoTo: string;
  chronoHint: string;
}

const PILL = (active: boolean) =>
  `rounded-md px-2.5 py-1 text-xs ${active ? "bg-accent text-accent-fg" : "text-muted hover:text-ink"}`;
const SELECT =
  "rounded-md border border-border bg-bg px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none";

/**
 * The scope picker every scope-aware Insights tool now shares: whole
 * Qur'an, Meccan/Medinan, a surah, a juz', or a window of revelation
 * order (see lib/insights/scope.ts for why the concept exists at all).
 *
 * Pulled out of CompareTab, which had it first, once Rhyme and
 * Collocations needed the same five buttons and the same follow-up
 * picker rather than a third bespoke "scope" of their own -- which is
 * what Letters' and Abjad's still-separate ayah/juz/surah pickers were
 * before this: two more scope concepts, neither sharing this one's
 * revelation-order axis, which is the one most Qur'anic scholarship
 * actually studies by.
 */
export function ScopeSelector({
  scope,
  onChange,
  meta,
  labels,
  defaultSurah = 12,
  defaultJuz = 30,
  defaultChronoTo = 20,
}: {
  scope: Scope;
  onChange: (scope: Scope) => void;
  meta: MetaFile;
  labels: ScopeLabels;
  defaultSurah?: number;
  defaultJuz?: number;
  defaultChronoTo?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted">{labels.scopeLabel}</span>
      <div className="flex flex-wrap rounded-lg border border-border p-0.5">
        <button
          type="button"
          className={PILL(scope.kind === "quran")}
          onClick={() => onChange({ kind: "quran" })}
        >
          {labels.scopeQuran}
        </button>
        <button
          type="button"
          className={PILL(scope.kind === "revelation" && scope.value === "meccan")}
          onClick={() => onChange({ kind: "revelation", value: "meccan" })}
        >
          {labels.scopeMeccan}
        </button>
        <button
          type="button"
          className={PILL(scope.kind === "revelation" && scope.value === "medinan")}
          onClick={() => onChange({ kind: "revelation", value: "medinan" })}
        >
          {labels.scopeMedinan}
        </button>
        <button
          type="button"
          className={PILL(scope.kind === "surah")}
          onClick={() => onChange({ kind: "surah", n: defaultSurah })}
        >
          {labels.scopeSurah}
        </button>
        <button
          type="button"
          className={PILL(scope.kind === "juz")}
          onClick={() => onChange({ kind: "juz", n: defaultJuz })}
        >
          {labels.scopeJuz}
        </button>
        <button
          type="button"
          className={PILL(scope.kind === "chrono")}
          onClick={() => onChange({ kind: "chrono", from: 1, to: defaultChronoTo })}
        >
          {labels.scopeChrono}
        </button>
      </div>

      {scope.kind === "surah" && (
        <select
          className={SELECT}
          value={scope.n}
          onChange={(e) => onChange({ kind: "surah", n: Number(e.target.value) })}
        >
          {meta.surahs.map((s) => (
            <option key={s.n} value={s.n}>
              {s.n}. {s.translit}
            </option>
          ))}
        </select>
      )}

      {scope.kind === "juz" && (
        <select
          className={SELECT}
          value={scope.n}
          onChange={(e) => onChange({ kind: "juz", n: Number(e.target.value) })}
        >
          {Array.from({ length: JUZ_COUNT }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {labels.juzLabel(n)}
            </option>
          ))}
        </select>
      )}

      {scope.kind === "chrono" && (
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <input
            type="number"
            min={1}
            max={114}
            value={scope.from}
            onChange={(e) =>
              onChange({
                kind: "chrono",
                from: Math.min(Math.max(1, Number(e.target.value)), scope.to),
                to: scope.to,
              })
            }
            className={`${SELECT} w-16`}
          />
          <span>{labels.chronoTo}</span>
          <input
            type="number"
            min={1}
            max={114}
            value={scope.to}
            onChange={(e) =>
              onChange({
                kind: "chrono",
                from: scope.from,
                to: Math.max(Math.min(114, Number(e.target.value)), scope.from),
              })
            }
            className={`${SELECT} w-16`}
          />
          <span>{labels.chronoHint}</span>
        </span>
      )}
    </div>
  );
}
