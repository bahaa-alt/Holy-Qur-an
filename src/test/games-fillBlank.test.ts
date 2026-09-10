import { describe, expect, it } from "vitest";
import { buildFillBlankRound } from "@/lib/games/fillBlank";
import type { SurahFile } from "@/lib/data/types";

const surah: SurahFile = {
  n: 1,
  verses: [
    { a: 1, w: ["بِسْمِ", "اللَّهِ", "الرَّحْمَٰنِ", "الرَّحِيمِ", "الْحَمْدُ", "لِلَّهِ"], t: "In the name..." },
    { a: 2, w: ["رَبِّ", "الْعَالَمِينَ"], t: "too short" },
    { a: 3, w: ["مَالِكِ", "يَوْمِ", "الدِّينِ", "إِيَّاكَ", "نَعْبُدُ", "وَإِيَّاكَ", "نَسْتَعِينُ"], t: "..." },
  ],
};

describe("buildFillBlankRound", () => {
  it("only ever blanks a verse with at least 6 tokens", () => {
    for (let seed = 0; seed < 20; seed++) {
      const round = buildFillBlankRound(surah, seed)!;
      const verse = surah.verses.find((v) => v.a === round.a)!;
      expect(verse.w.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("leaves at least one token of context on either side of the blank", () => {
    const round = buildFillBlankRound(surah, 5)!;
    expect(round.blankIndex).toBeGreaterThan(0);
    expect(round.blankIndex).toBeLessThan(round.tokens.length - 1);
  });

  it("includes the correct answer among the choices, at answerIndex", () => {
    const round = buildFillBlankRound(surah, 5)!;
    expect(round.choices[round.answerIndex]).toBe(round.tokens[round.blankIndex]);
  });

  it("never picks a distractor equal to the correct answer", () => {
    for (let seed = 0; seed < 20; seed++) {
      const round = buildFillBlankRound(surah, seed)!;
      const answer = round.choices[round.answerIndex];
      const distractors = round.choices.filter((_, i) => i !== round.answerIndex);
      expect(distractors.every((d) => d !== answer)).toBe(true);
    }
  });

  it("returns null when no verse has enough tokens", () => {
    const shortSurah: SurahFile = { n: 2, verses: [{ a: 1, w: ["a", "b", "c"], t: "..." }] };
    expect(buildFillBlankRound(shortSurah, 1)).toBeNull();
  });

  it("is deterministic for a given seed", () => {
    const r1 = buildFillBlankRound(surah, 3);
    const r2 = buildFillBlankRound(surah, 3);
    expect(r1).toEqual(r2);
  });
});
