"use client";

import type { ReactNode } from "react";
import { useT } from "@/lib/i18n/LanguageContext";

interface GameOption {
  key: string;
  label: ReactNode;
}

/**
 * Shared multiple-choice chrome for every game: renders the game-specific
 * prompt, then option buttons, correct/incorrect feedback once answered,
 * running session score/streak, and a "Next round" button. Purely
 * presentational -- each game component owns its own round state (built via
 * its pure round-builder) and localStorage-backed stats (src/lib/games/store.ts).
 */
export function GameShell({
  prompt,
  options,
  selectedKey,
  correctKey,
  onSelect,
  onNext,
  score,
  streak,
}: {
  prompt: ReactNode;
  options: GameOption[];
  selectedKey: string | null;
  correctKey: string;
  onSelect: (key: string) => void;
  onNext: () => void;
  score: { correct: number; total: number };
  streak: number;
}) {
  const t = useT();
  const answered = selectedKey !== null;
  const wasCorrect = selectedKey === correctKey;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{t.gameShell.score(score.correct, score.total)}</span>
        <span>{t.gameShell.streak(streak)}</span>
      </div>

      <div className="mt-4">{prompt}</div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const isSelected = opt.key === selectedKey;
          const isCorrectChoice = opt.key === correctKey;
          const base = "rounded-xl border px-4 py-3 text-start text-sm transition-colors";
          const state = !answered
            ? "border-border hover:border-accent"
            : isCorrectChoice
              ? "border-accent bg-accent/10 text-ink"
              : isSelected
                ? "border-danger bg-danger-bg text-ink"
                : "border-border text-muted";
          return (
            <button
              key={opt.key}
              type="button"
              disabled={answered}
              onClick={() => onSelect(opt.key)}
              className={`${base} ${state}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className={`text-sm font-medium ${wasCorrect ? "text-accent" : "text-danger"}`}>
            {wasCorrect ? t.gameShell.correct : t.gameShell.incorrect}
          </p>
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-strong"
          >
            {t.gameShell.nextRound}
          </button>
        </div>
      )}
    </div>
  );
}
