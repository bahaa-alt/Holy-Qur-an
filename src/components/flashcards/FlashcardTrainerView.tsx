"use client";

import { useEffect, useMemo, useState } from "react";
import { buildLemmaDeck, buildRootDeck } from "@/lib/flashcards/buildDeck";
import { selectSessionQueue } from "@/lib/flashcards/selectDue";
import { scheduleNext } from "@/lib/flashcards/scheduler";
import { getAllProgress, saveProgress } from "@/lib/flashcards/store";
import { FlashcardCard } from "./FlashcardCard";
import { useT } from "@/lib/i18n/LanguageContext";
import type { CardDef, CardId, CardProgress, DeckKind, Grade } from "@/lib/flashcards/types";
import type { IndexLemmaRow, IndexRootRow } from "@/lib/data/types";

const TAB_CLASS = (active: boolean) => `rounded-md px-3 py-1.5 ${active ? "bg-accent text-accent-fg" : "text-muted"}`;

export function FlashcardTrainerView({ roots, lemmas }: { roots: IndexRootRow[]; lemmas: IndexLemmaRow[] }) {
  const t = useT();
  const [deckKind, setDeckKind] = useState<DeckKind>("roots");
  const [progressById, setProgressById] = useState<Map<CardId, CardProgress>>(new Map());
  const [hydrated, setHydrated] = useState(false);
  const [queue, setQueue] = useState<CardDef[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    // One-time hydration from localStorage (unavailable during SSR/static
    // export, so the initial render has no progress yet) -- not a subscription.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgressById(getAllProgress());
    setHydrated(true);
  }, []);

  const deck = useMemo(
    () => (deckKind === "roots" ? buildRootDeck(roots) : buildLemmaDeck(lemmas, roots)),
    [deckKind, roots, lemmas],
  );

  function selectDeck(kind: DeckKind) {
    setDeckKind(kind);
    setQueue(null);
  }

  function startSession() {
    setQueue(selectSessionQueue(deck, progressById, new Date()));
    setIndex(0);
    setFlipped(false);
    setReviewedCount(0);
  }

  function grade(g: Grade) {
    if (!queue) return;
    const card = queue[index];
    const scheduled = scheduleNext(progressById.get(card.id) ?? null, g, new Date());
    const next: CardProgress = { ...scheduled, id: card.id };
    saveProgress(next);
    setProgressById((prev) => new Map(prev).set(card.id, next));
    setReviewedCount((c) => c + 1);
    if (index + 1 < queue.length) {
      setIndex(index + 1);
      setFlipped(false);
    } else {
      setQueue([]);
    }
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <div className="flex w-fit rounded-lg border border-border p-0.5 text-xs">
        <button type="button" onClick={() => selectDeck("roots")} className={TAB_CLASS(deckKind === "roots")}>
          {t.flashcardsPage.deckRoots}
        </button>
        <button type="button" onClick={() => selectDeck("lemmas")} className={TAB_CLASS(deckKind === "lemmas")}>
          {t.flashcardsPage.deckLemmas}
        </button>
      </div>

      {queue === null && (
        <button
          type="button"
          onClick={startSession}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-strong"
        >
          {t.flashcardsPage.startSession}
        </button>
      )}

      {queue !== null && queue.length === 0 && (
        <p className="text-sm text-ink">
          {reviewedCount === 0 ? t.flashcardsPage.noCardsDue : t.flashcardsPage.sessionComplete(reviewedCount)}
        </p>
      )}

      {queue !== null && queue.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-muted">{t.flashcardsPage.cardOf(index + 1, queue.length)}</p>
          <FlashcardCard card={queue[index]} flipped={flipped} onFlip={() => setFlipped(true)} />
          {flipped && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => grade("again")}
                className="rounded-lg border border-border px-3 py-2 text-sm text-ink hover:border-danger"
              >
                {t.flashcardsPage.again}
              </button>
              <button
                type="button"
                onClick={() => grade("hard")}
                className="rounded-lg border border-border px-3 py-2 text-sm text-ink hover:border-accent"
              >
                {t.flashcardsPage.hard}
              </button>
              <button
                type="button"
                onClick={() => grade("good")}
                className="rounded-lg border border-border px-3 py-2 text-sm text-ink hover:border-accent"
              >
                {t.flashcardsPage.good}
              </button>
              <button
                type="button"
                onClick={() => grade("easy")}
                className="rounded-lg border border-border px-3 py-2 text-sm text-ink hover:border-accent"
              >
                {t.flashcardsPage.easy}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
