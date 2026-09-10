import type { CardDef, CardId, CardProgress } from "./types";

/**
 * Builds one study session's queue: cards already due (dueAt <= now) come
 * first, ordered by how overdue they are (most overdue first), then
 * never-seen cards fill the rest, capped at `limit`.
 */
export function selectSessionQueue(
  cards: readonly CardDef[],
  progressById: ReadonlyMap<CardId, CardProgress>,
  now: Date,
  limit = 20,
): CardDef[] {
  const due: CardDef[] = [];
  const fresh: CardDef[] = [];

  for (const card of cards) {
    const progress = progressById.get(card.id);
    if (!progress) {
      fresh.push(card);
    } else if (new Date(progress.dueAt).getTime() <= now.getTime()) {
      due.push(card);
    }
  }

  due.sort((a, b) => {
    const da = new Date(progressById.get(a.id)!.dueAt).getTime();
    const db = new Date(progressById.get(b.id)!.dueAt).getTime();
    return da - db; // oldest due date (most overdue) first
  });

  return [...due, ...fresh].slice(0, limit);
}
