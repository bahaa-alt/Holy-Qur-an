import { describe, expect, it } from "vitest";
import { HIZB_COUNT, hizbForVerse, hizbRange } from "@/lib/quran/hizb";
import { JUZ_COUNT, juzRange } from "@/lib/quran/juz";

describe("hizbForVerse", () => {
  it("resolves the first verse of the Qur'an to Hizb 1", () => {
    expect(hizbForVerse(1, 1)).toBe(1);
  });

  it("resolves the last verse of the Qur'an to Hizb 60", () => {
    expect(hizbForVerse(114, 6)).toBe(60);
  });

  it("resolves a verse exactly at a Hizb boundary to the new Hizb", () => {
    expect(hizbForVerse(2, 75)).toBe(2);
    expect(hizbForVerse(2, 74)).toBe(1);
  });

  it("resolves every Hizb start point to its own Hizb number", () => {
    for (let hizb = 1; hizb <= HIZB_COUNT; hizb++) {
      const { start } = hizbRange(hizb);
      expect(hizbForVerse(start.s, start.a)).toBe(hizb);
    }
  });

  it("agrees with Juz' boundaries: Hizb (2n-1) always starts exactly where Juz' n starts", () => {
    for (let juz = 1; juz <= JUZ_COUNT; juz++) {
      expect(hizbRange(2 * juz - 1).start).toEqual(juzRange(juz).start);
    }
  });
});

describe("hizbRange", () => {
  it("gives Hizb 1 an end at Hizb 2's start", () => {
    const { start, end } = hizbRange(1);
    expect(start).toEqual({ s: 1, a: 1 });
    expect(end).toEqual({ s: 2, a: 75 });
  });

  it("gives Hizb 60 a null end (runs to the end of the Qur'an)", () => {
    expect(hizbRange(60).end).toBeNull();
  });

  it("throws for an out-of-range Hizb number", () => {
    expect(() => hizbRange(0)).toThrow();
    expect(() => hizbRange(61)).toThrow();
  });
});
