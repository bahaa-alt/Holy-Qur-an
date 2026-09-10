"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { GamePageShell } from "./GamePageShell";
import { RootFrequencyGame } from "./RootFrequencyGame";
import type { IndexRootRow } from "@/lib/data/types";

export function RootFrequencyGamePageContent({ roots }: { roots: IndexRootRow[] }) {
  const t = useT();
  return (
    <GamePageShell title={t.rootFrequencyGame.title} description={t.rootFrequencyGame.description}>
      <RootFrequencyGame roots={roots} />
    </GamePageShell>
  );
}
