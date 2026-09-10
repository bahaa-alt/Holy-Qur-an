import type { GameId, GameStats } from "./types";

/**
 * Per-game play stats, persisted entirely in localStorage -- no server, no
 * account, matching the rest of this app (c.f. src/lib/notes/store.ts).
 * Every read/write is wrapped in try/catch (private browsing, blocked
 * storage, a full quota all throw) so this never breaks the page around it.
 */
const STORAGE_KEY = "qrr:games";

function readAll(): Partial<Record<GameId, GameStats>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(all: Partial<Record<GameId, GameStats>>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable or full -- nothing more we can do here
  }
}

const EMPTY_STATS: GameStats = { played: 0, correct: 0, streak: 0, bestStreak: 0 };

export function getStats(gameId: GameId): GameStats {
  return readAll()[gameId] ?? EMPTY_STATS;
}

export function getAllStats(): Partial<Record<GameId, GameStats>> {
  return readAll();
}

export function recordResult(gameId: GameId, correct: boolean): GameStats {
  const all = readAll();
  const prev = all[gameId] ?? EMPTY_STATS;
  const streak = correct ? prev.streak + 1 : 0;
  const next: GameStats = {
    played: prev.played + 1,
    correct: prev.correct + (correct ? 1 : 0),
    streak,
    bestStreak: Math.max(prev.bestStreak, streak),
  };
  all[gameId] = next;
  writeAll(all);
  return next;
}
