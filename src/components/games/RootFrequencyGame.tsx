"use client";

import { useMemo, useState } from "react";
import { buildRootFrequencyRound } from "@/lib/games/rootFrequency";
import { recordResult } from "@/lib/games/store";
import { GameShell } from "./GameShell";
import { useT } from "@/lib/i18n/LanguageContext";
import type { IndexRootRow } from "@/lib/data/types";

export function RootFrequencyGame({ roots }: { roots: IndexRootRow[] }) {
  const t = useT();
  // Starts at a fixed seed so the first round matches the prerendered
  // static HTML exactly (avoids a hydration mismatch); only "next round" --
  // which only ever runs client-side, in response to a click -- advances to
  // a real, non-reproducible seed.
  const [seed, setSeed] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);

  const round = useMemo(() => buildRootFrequencyRound(roots, seed), [roots, seed]);
  const correctKey = round.higherIsA ? "a" : "b";

  function handleSelect(key: string) {
    if (selectedKey !== null) return;
    setSelectedKey(key);
    const correct = key === correctKey;
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setStreak((s) => (correct ? s + 1 : 0));
    recordResult("root-frequency", correct);
  }

  function nextRound() {
    setSelectedKey(null);
    setSeed(Date.now());
  }

  return (
    <GameShell
      prompt={<p className="text-sm text-ink">{t.rootFrequencyGame.prompt}</p>}
      options={[
        { key: "a", label: <span className="arabic-ui text-xl">{round.a.ar}</span> },
        { key: "b", label: <span className="arabic-ui text-xl">{round.b.ar}</span> },
      ]}
      selectedKey={selectedKey}
      correctKey={correctKey}
      onSelect={handleSelect}
      onNext={nextRound}
      score={score}
      streak={streak}
    />
  );
}
