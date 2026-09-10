import type { CardProgress, Grade } from "./types";

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

/**
 * A simplified SM-2 spaced-repetition scheduler. `now` is always injected
 * (never read internally via Date.now()) so this stays a pure, deterministic
 * function of its inputs -- same discipline as buildCitation/pickOfDay.
 *
 * - "again": the card lapsed -- reset the interval to 0 (due again today)
 *   and drop the ease factor, but only count it as a lapse if the card had
 *   actually matured past day 0 (a first-look "again" isn't a regression).
 * - "hard"/"good"/"easy": grow the interval (1 day -> 6 days -> interval *
 *   ease, the standard SM-2 progression) and nudge the ease factor per the
 *   classic SM-2 formula, floored at MIN_EASE so a hard deck never grinds
 *   its interval to zero growth.
 */
export function scheduleNext(progress: CardProgress | null, grade: Grade, now: Date): CardProgress {
  const prev: CardProgress = progress ?? {
    id: "",
    intervalDays: 0,
    ease: DEFAULT_EASE,
    dueAt: now.toISOString(),
    reps: 0,
    lapses: 0,
  };

  if (grade === "again") {
    return {
      ...prev,
      intervalDays: 0,
      ease: Math.max(MIN_EASE, prev.ease - 0.2),
      dueAt: now.toISOString(),
      reps: prev.reps + 1,
      lapses: prev.reps > 0 ? prev.lapses + 1 : prev.lapses,
    };
  }

  const easeDelta = grade === "hard" ? -0.15 : grade === "easy" ? 0.15 : 0;
  const nextEase = Math.max(MIN_EASE, prev.ease + easeDelta);

  let nextInterval: number;
  if (prev.reps === 0 || prev.intervalDays === 0) {
    nextInterval = grade === "hard" ? 1 : grade === "easy" ? 4 : 1;
  } else if (prev.intervalDays === 1) {
    nextInterval = grade === "hard" ? 3 : grade === "easy" ? 8 : 6;
  } else {
    const multiplier = grade === "hard" ? 1.2 : grade === "easy" ? nextEase * 1.3 : nextEase;
    nextInterval = Math.round(prev.intervalDays * multiplier);
  }

  const dueAt = new Date(now.getTime() + nextInterval * 86_400_000).toISOString();
  return {
    ...prev,
    intervalDays: nextInterval,
    ease: nextEase,
    dueAt,
    reps: prev.reps + 1,
  };
}
