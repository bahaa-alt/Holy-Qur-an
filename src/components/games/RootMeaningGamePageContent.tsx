"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { GamePageShell } from "./GamePageShell";
import { RootMeaningGame } from "./RootMeaningGame";
import type { IndexRootRow } from "@/lib/data/types";

export function RootMeaningGamePageContent({ roots }: { roots: IndexRootRow[] }) {
  const t = useT();
  return (
    <GamePageShell title={t.rootMeaningGame.title} description={t.rootMeaningGame.description}>
      <RootMeaningGame roots={roots} />
    </GamePageShell>
  );
}
