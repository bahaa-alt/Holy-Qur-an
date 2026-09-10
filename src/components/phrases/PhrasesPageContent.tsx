"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { PhraseSearch } from "./PhraseSearch";
import type { RootSlotOption } from "./RootSlotPicker";

export function PhrasesPageContent({ roots }: { roots: RootSlotOption[] }) {
  const t = useT();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.phrasesPage.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.phrasesPage.subtitle}</p>
      </div>
      <PhraseSearch roots={roots} />
    </div>
  );
}
