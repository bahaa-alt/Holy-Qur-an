"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { GamePageShell } from "./GamePageShell";
import { FillBlankGame } from "./FillBlankGame";

export function FillBlankGamePageContent() {
  const t = useT();
  return (
    <GamePageShell title={t.fillBlankGame.title} description={t.fillBlankGame.description}>
      <FillBlankGame />
    </GamePageShell>
  );
}
