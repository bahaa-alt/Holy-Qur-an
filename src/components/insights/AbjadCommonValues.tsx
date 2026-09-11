"use client";

import { useMemo } from "react";
import { buildAbjadCommonValues } from "@/lib/quran/abjadCommonValues";
import { useT } from "@/lib/i18n/LanguageContext";
import type { AbjadTotalsFile } from "@/lib/data/types";

const MAX_GROUPS_SHOWN = 40;

/**
 * Browsable table of Abjad values shared by 2+ verses/surahs/word forms --
 * unlike AbjadReverseLookup (which answers "what matches this one value I
 * already have"), this surfaces which values are worth looking up in the
 * first place. Clicking a row hands its value to the parent (AbjadTab),
 * which reuses the exact same lookup/scroll wiring as every other
 * clickable total on this page.
 */
export function AbjadCommonValues({
  abjad,
  onSelectValue,
}: {
  abjad: AbjadTotalsFile;
  onSelectValue: (value: number) => void;
}) {
  const t = useT();
  const groups = useMemo(() => buildAbjadCommonValues(abjad), [abjad]);

  return (
    <div className="border-t border-border pt-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted">{t.insightsPage.abjadCommonValuesHeading}</h3>
      <p className="mt-1 text-xs text-muted">{t.insightsPage.abjadCommonValuesDescription}</p>

      {groups.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t.insightsPage.abjadCommonValuesEmpty}</p>
      ) : (
        <>
          {groups.length > MAX_GROUPS_SHOWN && (
            <p className="mt-2 text-xs text-muted">
              {t.insightsPage.abjadCommonValuesShowingTop(MAX_GROUPS_SHOWN, groups.length)}
            </p>
          )}
          <div className="mt-2 max-h-96 space-y-1.5 overflow-y-auto pe-1">
            {groups.slice(0, MAX_GROUPS_SHOWN).map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => onSelectValue(g.value)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-start text-sm hover:border-accent"
              >
                <span className="font-semibold text-ink">{g.value.toLocaleString()}</span>
                <span className="text-xs text-muted">
                  {[
                    g.verseCount > 0 ? t.insightsPage.abjadCommonValuesVerses(g.verseCount) : null,
                    g.surahCount > 0 ? t.insightsPage.abjadCommonValuesSurahs(g.surahCount) : null,
                    g.wordForms.length > 0 ? t.insightsPage.abjadCommonValuesWords(g.wordForms.length) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
