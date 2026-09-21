"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getFormulas } from "@/lib/data/loader";
import { formulaHref } from "@/lib/search/suggest";
import { scopedFormulaRows, type ScopedFormulaRow } from "@/lib/insights/formulaScope";
import { scopeFromParam, scopeToParam, type Scope } from "@/lib/insights/scope";
import { ScopeSelector } from "./ScopeSelector";
import { ExportButton } from "@/components/export/ExportButton";
import { SaveButton } from "@/components/notes/SaveButton";
import { useUrlParam } from "@/lib/hooks/useUrlParam";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ExportTable } from "@/lib/export/table";
import type { FormulasFile, MetaFile } from "@/lib/data/types";

const LENGTHS = [3, 4, 5, 6] as const;
const LENGTH_PILL_CLASS = (active: boolean) =>
  `rounded-md px-3 py-1.5 ${active ? "bg-accent text-accent-fg" : "text-muted"}`;

function parseLength(raw: string | null): number | null {
  const n = raw !== null ? Number(raw) : NaN;
  return (LENGTHS as readonly number[]).includes(n) ? n : null;
}

function PhraseRow({
  length,
  row,
  max,
  occurrencesLabel,
}: {
  length: number;
  row: ScopedFormulaRow;
  max: number;
  occurrencesLabel: string;
}) {
  const pct = Math.max((row.scopedCount / max) * 100, 2);
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
        <div className="w-14 shrink-0 text-end text-xs text-muted">
          {row.scopedCount.toLocaleString()}
        </div>
      </div>
    </Link>
  );
}

/**
 * Recurring phrases were a whole-Qur'an-only leaderboard before this:
 * every count was corpus-wide, so "does this refrain cluster in the
 * Meccan surahs, or in one passage?" had no way to be asked here.
 *
 * The phrase LIST itself does not scope -- see formulaScope.ts for why:
 * build-formulas.ts already narrows each length to its whole-Qur'an top
 * 25, so a phrase that never earns a place on that list is invisible at
 * any scope. What scopes is how often an already-listed phrase recurs in
 * the chosen scope, which is still a real question (the shipped list is
 * every candidate fixed expression classical stylistics would call
 * takrar; a scope asks which of those cluster where).
 */
export function FormulasTab({ meta }: { meta: MetaFile }) {
  const t = useT();
  const [formulas, setFormulas] = useState<FormulasFile | null>(null);
  const [length, setLength] = useUrlParam<number>("formulasLength", 3, parseLength, String);
  const [scope, setScope] = useUrlParam<Scope>(
    "formulasScope",
    { kind: "quran" },
    scopeFromParam,
    scopeToParam,
  );

  useEffect(() => {
    let cancelled = false;
    getFormulas().then((f) => {
      if (!cancelled) setFormulas(f);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rawRows = useMemo(
    () => formulas?.lengths.find((g) => g.length === length)?.rows ?? [],
    [formulas, length],
  );
  const rows = useMemo<ScopedFormulaRow[]>(() => {
    if (scope.kind === "quran") return rawRows.map((r) => ({ ...r, scopedCount: r.count }));
    return scopedFormulaRows(rawRows, scope).sort((a, b) => b.scopedCount - a.scopedCount);
  }, [rawRows, scope]);
  const max = rows.length > 0 ? Math.max(...rows.map((r) => r.scopedCount)) : 1;

  function buildTable(): ExportTable {
    const scopeLabel = scopeToParam(scope);
    return {
      slug: `formulas-${length}-${scopeLabel.replace(":", "-")}`,
      meta: {
        title: `${t.insightsPage.formulasHeading}: ${t.insightsPage.formulasWordsLength(length)}`,
        provenance: [
          { label: "phrase length", value: String(length) },
          { label: "scope", value: scopeLabel },
        ],
      },
      columns: [
        { key: "phrase", label: "phrase" },
        { key: "count_in_scope", label: "count_in_scope" },
      ],
      rows: rows.map((r) => [r.display, r.scopedCount]),
    };
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.formulasHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.formulasDescription}</p>

      <div className="mt-4">
        <ScopeSelector
          scope={scope}
          onChange={setScope}
          meta={meta}
          labels={t.insightsPage.compare}
        />
      </div>
      {scope.kind !== "quran" && (
        <p className="mt-2 text-xs text-muted">{t.insightsPage.formulasScopedNote}</p>
      )}

      {!formulas ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.formulasLoading}
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex w-fit flex-wrap rounded-lg border border-border p-0.5 text-sm">
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
            <div className="flex items-center gap-2">
              <SaveButton
                id={`view:formulas:${length}:${scopeToParam(scope)}`}
                kind="view"
                label={`${t.insightsPage.formulasHeading}: ${t.insightsPage.formulasWordsLength(length)}`}
                detail={scopeToParam(scope)}
                href={`/insights/?tab=formulas&formulasLength=${length}&formulasScope=${scopeToParam(scope)}`}
                compact
              />
              <ExportButton
                path={`/insights/?tab=formulas&formulasLength=${length}&formulasScope=${scopeToParam(scope)}`}
                subject={{ kind: "formulas", label: scopeToParam(scope) }}
                resolve={buildTable}
              />
            </div>
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
                  occurrencesLabel={t.insightsPage.formulasOccurrencesCount(row.scopedCount)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
