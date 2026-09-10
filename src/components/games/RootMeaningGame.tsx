"use client";

import { useMemo, useState } from "react";
import { buildRootMeaningRound } from "@/lib/games/rootMeaning";
import { recordResult } from "@/lib/games/store";
import { GameShell } from "./GameShell";
import { useT } from "@/lib/i18n/LanguageContext";
import type { IndexRootRow } from "@/lib/data/types";

export function RootMeaningGame({ roots }: { roots: IndexRootRow[] }) {
  const t = useT();
  // See RootFrequencyGame for why the first round uses a fixed seed.
  const [seed, setSeed] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);

  const round = useMemo(() => buildRootMeaningRound(roots, seed), [roots, seed]);
  const correctKey = String(round.answerIndex);

  function handleSelect(key: string) {
    if (selectedKey !== null) return;
    setSelectedKey(key);
    const correct = key === correctKey;
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setStreak((s) => (correct ? s + 1 : 0));
    recordResult("root-meaning", correct);
  }

  function nextRound() {
    setSelectedKey(null);
    setSeed(Date.now());
  }

  return (
    <GameShell
      prompt={
        <div>
          <p className="text-sm text-ink">{t.rootMeaningGame.prompt}</p>
          <p className="arabic-ui mt-1 text-2xl text-ink">{round.target.ar}</p>
        </div>
      }
      options={round.choices.map((choice, i) => ({ key: String(i), label: choice }))}
      selectedKey={selectedKey}
      correctKey={correctKey}
      onSelect={handleSelect}
      onNext={nextRound}
      score={score}
      streak={streak}
    />
  );
}
