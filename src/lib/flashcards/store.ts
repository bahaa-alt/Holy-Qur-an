import type { CardId, CardProgress } from "./types";

/**
 * Flashcard progress, persisted entirely in localStorage -- no server, no
 * account, matching the rest of this app (c.f. src/lib/notes/store.ts and
 * src/lib/games/store.ts). Every read/write is wrapped in try/catch
 * (private browsing, blocked storage, a full quota all throw) so this
 * never breaks the page around it. No test file, same rationale as
 * games/store.ts: vitest runs in a node environment with no localStorage.
 */
const STORAGE_KEY = "qrr:flashcards";

function readAll(): Record<CardId, CardProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<CardId, CardProgress>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable or full -- nothing more we can do here
  }
}

export function getAllProgress(): Map<CardId, CardProgress> {
  return new Map(Object.entries(readAll()));
}

export function saveProgress(progress: CardProgress): void {
  const all = readAll();
  all[progress.id] = progress;
  writeAll(all);
}
