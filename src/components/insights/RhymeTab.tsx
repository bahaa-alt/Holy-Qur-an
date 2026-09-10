"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getRhyme } from "@/lib/data/loader";
import { countRhymeEndings, versesWithEnding } from "@/lib/quran/rhyme";
import { LetterFrequencyTable } from "./LetterFrequencyTable";
import { useT } from "@/lib/i18n/LanguageContext";
import type { RhymeFile } from "@/lib/data/types";

const MAX_SHOWN = 60;

export function RhymeTab() {
  const t = useT();
  const [rhyme, setRhyme] = useState<RhymeFile | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRhyme().then((r) => {
      if (!cancelled) setRhyme(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const endingCounts = useMemo(() => (rhyme ? countRhymeEndings(rhyme.rows) : []), [rhyme]);
  const matches = useMemo(() => (rhyme && selected ? versesWithEnding(rhyme.rows, selected) : []), [rhyme, selected]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{t.insightsPage.rhymeHeading}</h2>
      <p className="mt-1 text-sm text-muted">{t.insightsPage.rhymeDescription}</p>

      {!rhyme ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> {t.insightsPage.rhymeLoading}
        </p>
      ) : (
        <>
          <LetterFrequencyTable
            rows={endingCounts}
            selectedLetter={selected}
            onSelectLetter={(letter) => setSelected((prev) => (prev === letter ? null : letter))}
          />

          <div className="mt-4 border-t border-border pt-4">
            {selected === null ? (
              <p className="text-sm text-muted">{t.insightsPage.rhymePickPrompt}</p>
            ) : (
              <>
                <p className="text-sm text-muted">{t.insightsPage.rhymeShowingCount(Math.min(matches.length, MAX_SHOWN), matches.length)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {matches.slice(0, MAX_SHOWN).map((m) => (
                    <Link
                      key={`${m.s}:${m.a}`}
                      href={`/surah/${m.s}/?ayah=${m.a}`}
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
