"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getSurah } from "@/lib/data/loader";
import { buildFillBlankRound, type FillBlankRound } from "@/lib/games/fillBlank";
import { recordResult } from "@/lib/games/store";
import { GameShell } from "./GameShell";
import { useT } from "@/lib/i18n/LanguageContext";

const TOTAL_SURAHS = 114;
const MAX_ATTEMPTS = 10;

/**
 * Picks a random surah and, from it, a fill-in-the-blank round. Unlike the
 * daily widget, this is a game session, not a "same for everyone today"
 * feature, so real (non-seeded) randomness is intentional here -- it only
 * ever runs inside this effect, client-side, in response to user action
 * (mount or "next round"), never during the shared server/client initial
 * render, so there's no hydration-mismatch concern.
 */
async function drawRound(): Promise<FillBlankRound | null> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const n = 1 + Math.floor(Math.random() * TOTAL_SURAHS);
    const surah = await getSurah(n);
    const round = buildFillBlankRound(surah, Date.now() + attempt);
    if (round) return round;
  }
  return null;
}

export function FillBlankGame() {
  const t = useT();
  const [round, setRound] = useState<FillBlankRound | null | undefined>(undefined);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let cancelled = false;
    drawRound().then((r) => {
      if (!cancelled) setRound(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelect(key: string) {
    if (selectedKey !== null || !round) return;
    setSelectedKey(key);
    const correct = key === String(round.answerIndex);
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setStreak((s) => (correct ? s + 1 : 0));
    recordResult("fill-blank", correct);
  }

  function nextRound() {
    setSelectedKey(null);
    setRound(undefined);
    drawRound().then(setRound);
  }

  if (round === undefined) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-6 py-16 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" /> {t.fillBlankGame.loading}
      </div>
    );
  }
  if (round === null) return null;

  const correctKey = String(round.answerIndex);
  const displayTokens = round.tokens.map((tok, i) => (i === round.blankIndex ? "____" : tok));

  return (
    <GameShell
      prompt={
        <div>
          <p className="text-sm text-ink">{t.fillBlankGame.prompt}</p>
          <p className="arabic-ui mt-2 text-xl leading-loose text-ink" dir="rtl">
            {displayTokens.join(" ")}
          </p>
        </div>
      }
      options={round.choices.map((choice, i) => ({
        key: String(i),
        label: <span className="arabic-ui text-lg">{choice}</span>,
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
