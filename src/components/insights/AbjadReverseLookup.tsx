"use client";

import { useMemo } from "react";
import Link from "next/link";
import { findByAbjadValue } from "@/lib/quran/abjadLookup";
import { useT } from "@/lib/i18n/LanguageContext";
import type { AbjadTotalsFile, MetaFile } from "@/lib/data/types";

const MAX_VERSES_SHOWN = 60;

/**
 * Controlled by the parent (AbjadTab) rather than owning its own input
 * state, so a click on a displayed total elsewhere on the page (e.g. the
 * "quran total" figure above) can populate this lookup with that exact
 * value instead of making the user retype the number they just saw.
 */
export function AbjadReverseLookup({
  abjad,
  meta,
  input,
  onInputChange,
}: {
  abjad: AbjadTotalsFile;
  meta: MetaFile;
  input: string;
  onInputChange: (value: string) => void;
}) {
  const t = useT();

  const value = input.trim() === "" ? null : Number(input);
  const isValid = value !== null && Number.isInteger(value) && value > 0;

  const matches = useMemo(() => {
    if (!isValid) return null;
    return findByAbjadValue(abjad, meta, value!);
  }, [abjad, meta, isValid, value]);

  return (
    <div className="border-t border-border pt-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted">{t.insightsPage.abjadLookupHeading}</h3>
      <p className="mt-1 text-xs text-muted">{t.insightsPage.abjadLookupDescription}</p>
      <input
        type="number"
        min={1}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder={t.insightsPage.abjadLookupPlaceholder}
        className="mt-2 w-40 rounded-lg border border-border px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:outline-none"
      />

      {input.trim() !== "" && !isValid && (
        <p className="mt-2 text-sm text-muted">{t.insightsPage.abjadLookupInvalid}</p>
      )}

      {matches && (
        <div className="mt-3 space-y-3">
          {matches.surahs.length > 0 && (
            <div>
              <p className="text-xs text-muted">{t.insightsPage.abjadLookupSurahsFound(matches.surahs.length)}</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {matches.surahs.map((n) => {
                  const s = meta.surahs.find((sm) => sm.n === n);
                  return (
                    <Link
                      key={n}
                      href={`/surah/${n}/`}
                      className="rounded-full border border-border px-2.5 py-1 text-xs text-accent hover:border-accent"
                    >
                      {n}. {s?.nameEn ?? n}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-muted">
              {matches.verses.length === 0
                ? t.insightsPage.abjadLookupNoVerses
                : t.insightsPage.abjadLookupVersesFound(Math.min(matches.verses.length, MAX_VERSES_SHOWN), matches.verses.length)}
            </p>
            {matches.verses.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-2">
                {matches.verses.slice(0, MAX_VERSES_SHOWN).map((ref) => (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
