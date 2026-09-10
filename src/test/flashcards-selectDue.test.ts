import { describe, expect, it } from "vitest";
import { selectSessionQueue } from "@/lib/flashcards/selectDue";
import type { CardDef, CardProgress } from "@/lib/flashcards/types";

const NOW = new Date("2026-01-10T00:00:00Z");

function card(id: string): CardDef {
  return { id, kind: "roots", ar: id, root: id };
}

function progress(id: string, dueAt: string): CardProgress {
  return { id, intervalDays: 1, ease: 2.5, dueAt, reps: 1, lapses: 0 };
}

describe("selectSessionQueue", () => {
  it("puts due cards before never-seen cards", () => {
    const cards = [card("fresh"), card("due")];
    const progressById = new Map([["due", progress("due", "2026-01-09T00:00:00Z")]]);
    const queue = selectSessionQueue(cards, progressById, NOW);
    expect(queue.map((c) => c.id)).toEqual(["due", "fresh"]);
  });

  it("orders due cards most-overdue first", () => {
    const cards = [card("a"), card("b"), card("c")];
    const progressById = new Map([
      ["a", progress("a", "2026-01-08T00:00:00Z")],
      ["b", progress("b", "2026-01-05T00:00:00Z")],
      ["c", progress("c", "2026-01-09T12:00:00Z")],
    ]);
    const queue = selectSessionQueue(cards, progressById, NOW);
    expect(queue.map((c) => c.id)).toEqual(["b", "a", "c"]);
  });

  it("excludes cards not yet due", () => {
    const cards = [card("notYet")];
    const progressById = new Map([["notYet", progress("notYet", "2026-02-01T00:00:00Z")]]);
    expect(selectSessionQueue(cards, progressById, NOW)).toEqual([]);
  });

  it("caps the queue at the given limit", () => {
    const cards = Array.from({ length: 30 }, (_, i) => card(`c${i}`));
    const queue = selectSessionQueue(cards, new Map(), NOW, 20);
    expect(queue).toHaveLength(20);
  });

  it("is empty when nothing is due and the deck is empty", () => {
    expect(selectSessionQueue([], new Map(), NOW)).toEqual([]);
  });
});
