"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getIndex, getMeta, getVerses } from "@/lib/data/loader";
import { pickRootOfDay, pickVerseOfDay } from "@/lib/dailyPick/pickOfDay";
import { rootHref } from "@/lib/search/suggest";
import { useT } from "@/lib/i18n/LanguageContext";
import type { IndexRootRow, SurahVerse } from "@/lib/data/types";

interface DailyState {
  root: IndexRootRow;
  verseRef: { s: number; a: number };
  verse: SurahVerse | null;
}

/**
 * A small "same for everyone today" pair of picks (one root, one verse),
 * computed purely from the calendar day -- no backend, no per-user state.
 * See src/lib/dailyPick/pickOfDay.ts for the deterministic selection.
 */
export function DailyWidget() {
  const t = useT();
  const [state, setState] = useState<DailyState | null>(null);

  useEffect(() => {
    let cancelled = false;
    const today = new Date();
    Promise.all([getIndex(), getMeta()]).then(([index, meta]) => {
      if (cancelled) return;
      const root = pickRootOfDay(index, today);
      const verseRef = pickVerseOfDay(meta, today);
      setState({ root, verseRef, verse: null });
      getVerses([verseRef]).then((verses) => {
        if (cancelled) return;
        const verse = verses.get(`${verseRef.s}:${verseRef.a}`) ?? null;
        setState((prev) => (prev ? { ...prev, verse } : prev));
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state) return null;

  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">{t.dailyWidget.rootHeading}</h2>
        <p className="arabic-ui mt-2 text-2xl text-ink">{state.root.ar}</p>
        {state.root.glossShort && <p className="mt-1 text-sm text-muted">{state.root.glossShort}</p>}
        <Link href={rootHref(state.root.ar)} className="mt-3 inline-block text-sm text-accent hover:underline">
          {t.dailyWidget.viewRoot}
        </Link>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">{t.dailyWidget.verseHeading}</h2>
        {state.verse ? (
          <>
            <p className="arabic-ui mt-2 text-lg leading-loose text-ink">{state.verse.w.join(" ")}</p>
            <p className="mt-1 text-sm text-muted">{state.verse.t}</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">…</p>
        )}
        <Link
          href={`/surah/${state.verseRef.s}/?ayah=${state.verseRef.a}`}
          className="mt-3 inline-block text-sm text-accent hover:underline"
        >
          {t.dailyWidget.viewVerse}
        </Link>
      </div>
    </div>
  );
}
