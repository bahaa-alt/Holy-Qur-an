"use client";

import { useMemo, useState } from "react";
import { buildLemmaRootRound } from "@/lib/games/lemmaRoot";
import { recordResult } from "@/lib/games/store";
import { GameShell } from "./GameShell";
import { useT } from "@/lib/i18n/LanguageContext";
import type { IndexLemmaRow, IndexRootRow } from "@/lib/data/types";

export function LemmaRootGame({ roots, lemmas }: { roots: IndexRootRow[]; lemmas: IndexLemmaRow[] }) {
  const t = useT();
  // See RootFrequencyGame for why the first round uses a fixed seed.
  const [seed, setSeed] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);

  const round = useMemo(() => buildLemmaRootRound(lemmas, roots, seed), [lemmas, roots, seed]);

  function handleSelect(key: string) {
    if (selectedKey !== null || !round) return;
    setSelectedKey(key);
    const correct = key === String(round.answerIndex);
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setStreak((s) => (correct ? s + 1 : 0));
    recordResult("lemma-root", correct);
  }

  function nextRound() {
    setSelectedKey(null);
    setSeed(Date.now());
  }

  if (!round) return null;
  const correctKey = String(round.answerIndex);

  return (
    <GameShell
      prompt={
        <div>
          <p className="text-sm text-ink">{t.lemmaRootGame.prompt}</p>
          <p className="arabic-ui mt-1 text-2xl text-ink">{round.lemma.lemma}</p>
        </div>
      }
      options={round.choices.map((choice, i) => ({
        key: String(i),
        label: <span className="arabic-ui text-lg">{choice.ar}</span>,
      }))}
      selectedKey={selectedKey}
      correctKey={correctKey}
      onSelect={handleSelect}
      onNext={nextRound}
      score={score}
      streak={streak}
    />
  );
}
