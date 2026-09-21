import { describe, expect, it } from "vitest";
import { pairInScope } from "@/lib/insights/verseSimilarityScope";

const inSurah1 = { s: 1, a: 3 };
const alsoInSurah1 = { s: 1, a: 7 };
const inSurah2 = { s: 2, a: 5 };

describe("pairInScope", () => {
  it("'both' requires both verses inside the scope", () => {
    expect(pairInScope({ kind: "surah", n: 1 }, inSurah1, alsoInSurah1, "both")).toBe(true);
    expect(pairInScope({ kind: "surah", n: 1 }, inSurah1, inSurah2, "both")).toBe(false);
  });

  it("'either' only requires one verse inside the scope", () => {
    expect(pairInScope({ kind: "surah", n: 1 }, inSurah1, inSurah2, "either")).toBe(true);
    expect(pairInScope({ kind: "surah", n: 1 }, inSurah2, inSurah2, "either")).toBe(false);
  });

  it("both modes agree at whole-Qur'an scope: every pair is in scope", () => {
    expect(pairInScope({ kind: "quran" }, inSurah1, inSurah2, "both")).toBe(true);
    expect(pairInScope({ kind: "quran" }, inSurah1, inSurah2, "either")).toBe(true);
  });
});
