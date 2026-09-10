import { describe, expect, it } from "vitest";
import { scheduleNext } from "@/lib/flashcards/scheduler";
import type { CardProgress } from "@/lib/flashcards/types";

const NOW = new Date("2026-01-01T00:00:00Z");

describe("scheduleNext", () => {
  it("grows the interval on repeated 'good' grades", () => {
    let progress: CardProgress | null = null;
    const intervals: number[] = [];
    for (let i = 0; i < 4; i++) {
      progress = scheduleNext(progress, "good", NOW);
      intervals.push(progress.intervalDays);
    }
    expect(intervals).toEqual([1, 6, 15, 38]);
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
    }
  });

  it("resets a matured card's interval to 0 on 'again' and counts a lapse", () => {
    let progress: CardProgress | null = null;
    progress = scheduleNext(progress, "good", NOW); // interval 1, reps 1
    progress = scheduleNext(progress, "good", NOW); // interval 6, reps 2
    expect(progress.intervalDays).toBe(6);

    const lapsed = scheduleNext(progress, "again", NOW);
    expect(lapsed.intervalDays).toBe(0);
    expect(lapsed.lapses).toBe(1);
    expect(new Date(lapsed.dueAt).getTime()).toBe(NOW.getTime());
  });

  it("does not count a lapse on a brand-new card's first 'again'", () => {
    const first = scheduleNext(null, "again", NOW);
    expect(first.lapses).toBe(0);
    expect(first.intervalDays).toBe(0);
  });

  it("floors the ease factor and never lets it go below the floor", () => {
    let progress: CardProgress | null = null;
    for (let i = 0; i < 15; i++) {
      progress = scheduleNext(progress, "hard", NOW);
    }
    expect(progress!.ease).toBeCloseTo(1.3, 5);
  });

  it("is a pure function of its inputs (same call, same result)", () => {
    const progress = scheduleNext(null, "good", NOW);
    const a = scheduleNext(progress, "easy", NOW);
    const b = scheduleNext(progress, "easy", NOW);
    expect(a).toEqual(b);
  });
});
