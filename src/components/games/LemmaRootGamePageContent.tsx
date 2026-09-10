"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { GamePageShell } from "./GamePageShell";
import { LemmaRootGame } from "./LemmaRootGame";
import type { IndexLemmaRow, IndexRootRow } from "@/lib/data/types";

export function LemmaRootGamePageContent({ roots, lemmas }: { roots: IndexRootRow[]; lemmas: IndexLemmaRow[] }) {
  const t = useT();
  return (
    <GamePageShell title={t.lemmaRootGame.title} description={t.lemmaRootGame.description}>
      <LemmaRootGame roots={roots} lemmas={lemmas} />
    </GamePageShell>
  );
}
