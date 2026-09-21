"use client";

import { useMemo, useState, useEffect } from "react";
import { verseHref } from "@/lib/search/suggest";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getRhyme } from "@/lib/data/loader";
import { countRhymeEndings, versesWithEnding } from "@/lib/quran/rhyme";
import { LetterFrequencyTable } from "./LetterFrequencyTable";
import { ScopeSelector } from "./ScopeSelector";
import { ExportButton } from "@/components/export/ExportButton";
import { SaveButton } from "@/components/notes/SaveButton";
import { useUrlParam } from "@/lib/hooks/useUrlParam";
import { inScope, scopeFromParam, scopeToParam, type Scope } from "@/lib/insights/scope";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ExportTable } from "@/lib/export/table";
import type { MetaFile, RhymeFile } from "@/lib/data/types";

const MAX_SHOWN = 60;

/**
 * Rhyme (fawāṣil/sajʿ) was a whole-Qur'an-only lookup before this: every
 * ending count was corpus-wide, so "does Meccan sajʿ favor a different
 * ending than Medinan?" or "what dominates Surah ar-Raḥmān's endings" --
 * real questions about the Qur'an's rhetorical style -- had no way to be
 * asked here at all. RhymeRow already carries its own s/a, so scoping is
 * a plain filter over already-tested primitives (inScope,
 * countRhymeEndings, versesWithEnding); no data or lib change needed.
 */
export function RhymeTab({ meta }: { meta: MetaFile }) {
  const t = useT();
  const [rhyme, setRhyme] = useState<RhymeFile | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [scope, setScope] = useUrlParam<Scope>(
    "rhymeScope",
    { kind: "quran" },
    scopeFromParam,
    scopeToParam,
  );

  useEffect(() => {
    let cancelled = false;
    getRhyme().then((r) => {
      if (!cancelled) setRhyme(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const scopedRows = useMemo(
    () => (rhyme ? rhyme.rows.filter((r) => inScope(scope, r)) : []),
    [rhyme, scope],
  );
  const endingCounts = useMemo(() => countRhymeEndings(scopedRows), [scopedRows]);
  const matches = useMemo(
    () => (selected ? versesWithEnding(scopedRows, selected) : []),
    [scopedRows, selected],
  );

  function buildTable(): ExportTable {
    const scopeLabel = scopeToParam(scope);
    return {
      slug: `rhyme-${scopeLabel.replace(":", "-")}`,
      meta: {
        title: t.insightsPage.rhymeHeading,
        provenance: [
          { label: "scope", value: scopeLabel },
          { label: "verses in scope", value: String(scopedRows.length) },
        ],
      },
      columns: [
        { key: "ending", label: "ending" },
        { key: "count", label: "count" },
      ],
      rows: endingCounts.map((r) => [r.letter, r.count]),
    };
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.rhymeHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.rhymeDescription}</p>

      <div className="mt-4">
        <ScopeSelector
          scope={scope}
          onChange={setScope}
          meta={meta}
          labels={t.insightsPage.compare}
        />
      </div>

      {!rhyme ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.rhymeLoading}
        </p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <SaveButton
              id={`view:rhyme:${scopeToParam(scope)}`}
              kind="view"
              label={`${t.insightsPage.tabRhyme}: ${scopeToParam(scope)}`}
              detail={t.insightsPage.rhymeHeading}
              href={`/insights/?tab=rhyme&rhymeScope=${scopeToParam(scope)}`}
              compact
            />
            <ExportButton
              path={`/insights/?tab=rhyme&rhymeScope=${scopeToParam(scope)}`}
              subject={{ kind: "rhyme", label: scopeToParam(scope) }}
              resolve={buildTable}
            />
          </div>

          <div className="mt-4">
            <LetterFrequencyTable
              rows={endingCounts}
              selectedLetter={selected}
              onSelectLetter={(letter) => setSelected((prev) => (prev === letter ? null : letter))}
            />
          </div>

          <div className="mt-4 border-t border-border pt-4">
            {selected === null ? (
              <p className="text-sm text-muted">{t.insightsPage.rhymePickPrompt}</p>
            ) : (
              <>
                <p className="text-sm text-muted">
                  {t.insightsPage.rhymeShowingCount(
                    Math.min(matches.length, MAX_SHOWN),
                    matches.length,
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {matches.slice(0, MAX_SHOWN).map((m) => (
                    <Link
                      key={`${m.s}:${m.a}`}
                      href={verseHref(m.s, m.a)}
                      className="rounded-full border border-border px-2.5 py-1 text-xs text-accent hover:border-accent"
                    >
                      <bdi>
                        {m.s}:{m.a}
                      </bdi>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
