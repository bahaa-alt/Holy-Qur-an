"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { FlashcardTrainerView } from "./FlashcardTrainerView";
import type { IndexLemmaRow, IndexRootRow } from "@/lib/data/types";

export function FlashcardsPageContent({ roots, lemmas }: { roots: IndexRootRow[]; lemmas: IndexLemmaRow[] }) {
  const t = useT();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.flashcardsPage.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.flashcardsPage.subtitle}</p>
      </div>
      <FlashcardTrainerView roots={roots} lemmas={lemmas} />
    </div>
  );
}
