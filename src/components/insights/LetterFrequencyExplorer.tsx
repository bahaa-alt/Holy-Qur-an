"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageContext";
import { ScopeSelector } from "./ScopeSelector";
import { LetterFrequencyTable } from "./LetterFrequencyTable";
import { LetterFrequencyResult } from "./LetterFrequencyResult";
import { ExportButton } from "@/components/export/ExportButton";
import { SaveButton } from "@/components/notes/SaveButton";
import { useUrlParam } from "@/lib/hooks/useUrlParam";
import { scopeFromParam, scopeToParam, type Scope } from "@/lib/insights/scope";
import type { LetterCount } from "@/lib/arabic/letterFrequency";
import type { ExportTable } from "@/lib/export/table";
import type { MetaFile } from "@/lib/data/types";

function parseAyahParam(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

function hrefFor(scope: Scope, ayah: number | null): string {
  const base = `/insights/?tab=letters&lettersScope=${scopeToParam(scope)}`;
  return ayah === null ? base : `${base}&lettersAyah=${ayah}`;
}

/**
 * Letter frequency had its own separate quran/surah/juz/ayah scope concept
 * before this -- one more scope, alongside Compare's, that shared none of
 * its revelation-order axis or its Save/Export links. Now on the same
 * Scope every other Insights tool uses (see ScopeSelector's doc comment),
 * with "narrow to a single ayah" kept as an extra refinement layered on
 * top of a surah scope, since no other tool needs single-verse granularity
 * and the shared Scope type has no reason to grow a sixth kind for it.
 */
export function LetterFrequencyExplorer({
  meta,
  wholeQuranFrequency,
}: {
  meta: MetaFile;
  wholeQuranFrequency: LetterCount[];
}) {
  const t = useT();
  const [scope, setScope] = useUrlParam<Scope>(
    "lettersScope",
    { kind: "quran" },
    scopeFromParam,
    scopeToParam,
  );
  const [ayahNum, setAyahNum] = useUrlParam<number | null>(
    "lettersAyah",
    null,
    parseAyahParam,
    (v) => (v === null ? null : String(v)),
  );
  // LetterFrequencyResult holds its own fetched rows; mirrored up here only
  // so Export can read the currently-displayed table without refetching.
  const [lastRows, setLastRows] = useState<LetterCount[] | null>(null);

  function changeScope(next: Scope) {
    setScope(next);
    if (next.kind !== "surah") setAyahNum(null);
  }

  const maxAyah =
    scope.kind === "surah" ? (meta.surahs.find((s) => s.n === scope.n)?.ayahs ?? 1) : 1;
  const clampedAyah = ayahNum === null ? null : Math.min(Math.max(1, ayahNum), maxAyah);
  const resultKey = `${scopeToParam(scope)}:${clampedAyah ?? "all"}`;
  const isWholeQuran = scope.kind === "quran";
  const displayedRows = isWholeQuran ? wholeQuranFrequency : (lastRows ?? []);

  function buildTable(): ExportTable {
    const scopeLabel = scopeToParam(scope);
    return {
      slug: `letters-${scopeLabel.replace(":", "-")}${clampedAyah !== null ? `-${clampedAyah}` : ""}`,
      meta: {
        title: t.insightsPage.letterFrequencyHeading,
        provenance: [
          { label: "scope", value: scopeLabel },
          ...(clampedAyah !== null ? [{ label: "ayah", value: String(clampedAyah) }] : []),
        ],
      },
      columns: [
        { key: "letter", label: "letter" },
        { key: "count", label: "count" },
      ],
      rows: displayedRows.map((r) => [r.letter, r.count]),
    };
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.letterFrequencyHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.letterFrequencyDescription}</p>

      <div className="mt-4">
        <ScopeSelector
          scope={scope}
          onChange={changeScope}
          meta={meta}
          labels={t.insightsPage.compare}
        />
      </div>

      {scope.kind === "surah" && (
        <label className="mt-2 flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={ayahNum !== null}
            onChange={(e) => setAyahNum(e.target.checked ? 1 : null)}
          />
          {t.insightsPage.scopeAyah}
          {ayahNum !== null && (
            <input
              type="number"
              min={1}
              max={maxAyah}
              value={clampedAyah ?? 1}
              onChange={(e) => setAyahNum(Number(e.target.value) || 1)}
              className="w-20 rounded-lg border border-border px-2 py-1 text-sm text-ink focus:outline-none"
            />
          )}
        </label>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <SaveButton
          id={`view:letters:${scopeToParam(scope)}:${clampedAyah ?? "all"}`}
          kind="view"
          label={`${t.insightsPage.tabLetters}: ${scopeToParam(scope)}`}
          detail={t.insightsPage.letterFrequencyHeading}
          href={hrefFor(scope, clampedAyah)}
          compact
        />
        <ExportButton
          path={hrefFor(scope, clampedAyah)}
          subject={{ kind: "letters", label: scopeToParam(scope) }}
          resolve={buildTable}
        />
      </div>

      {isWholeQuran ? (
        <LetterFrequencyTable rows={wholeQuranFrequency} />
      ) : (
        <LetterFrequencyResult
          key={resultKey}
          meta={meta}
          scope={scope}
          ayahNum={clampedAyah}
          onRows={setLastRows}
        />
      )}
    </div>
  );
}
