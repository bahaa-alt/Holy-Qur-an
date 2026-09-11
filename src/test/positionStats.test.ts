import { describe, expect, it } from "vitest";
import { buildWordPositionStats } from "@/lib/word/positionStats";

// Verse word counts: 1:1 has 4 words, 1:2 has 6 words, 1:3 has 1 word (a
// degenerate single-word verse, exercising the start/end tie-break).
const VERSE_LENGTHS = new Map<string, number>([
  ["1:1", 4],
  ["1:2", 6],
  ["1:3", 1],
]);
const lengthOf = (s: number, a: number) => VERSE_LENGTHS.get(`${s}:${a}`);

describe("buildWordPositionStats", () => {
  it("classifies word 1 as the start of the verse", () => {
    const stats = buildWordPositionStats([{ s: 1, a: 1, w: 1 }], lengthOf);
    expect(stats).toMatchObject({ startCount: 1, endCount: 0, middleCount: 0, total: 1 });
  });

  it("classifies the last word as the end of the verse", () => {
    const stats = buildWordPositionStats([{ s: 1, a: 1, w: 4 }], lengthOf);
    expect(stats).toMatchObject({ startCount: 0, endCount: 1, middleCount: 0 });
  });

  it("classifies a word neither first nor last as the middle", () => {
    const stats = buildWordPositionStats([{ s: 1, a: 2, w: 3 }], lengthOf);
    expect(stats).toMatchObject({ startCount: 0, endCount: 0, middleCount: 1 });
  });

  it("counts a single-word verse's only word as the start, not the end", () => {
    const stats = buildWordPositionStats([{ s: 1, a: 3, w: 1 }], lengthOf);
    expect(stats).toMatchObject({ startCount: 1, endCount: 0, middleCount: 0 });
  });

  it("skips an occurrence whose verse length is unknown, without throwing", () => {
    const stats = buildWordPositionStats([{ s: 9, a: 9, w: 1 }], lengthOf);
    expect(stats).toMatchObject({ startCount: 0, endCount: 0, middleCount: 0, total: 1 });
  });

  it("aggregates a position histogram across all occurrences, sorted by position", () => {
    const stats = buildWordPositionStats(
      [
        { s: 1, a: 1, w: 2 },
        { s: 1, a: 2, w: 2 },
        { s: 1, a: 1, w: 1 },
        { s: 1, a: 2, w: 2 },
      ],
      lengthOf,
    );
    expect(stats.positions).toEqual([
      { position: 1, count: 1 },
      { position: 2, count: 3 },
    ]);
    expect(stats.total).toBe(4);
  });
});
