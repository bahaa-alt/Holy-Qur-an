import { describe, expect, it } from "vitest";
import { classify, extractMood, extractVerbForm } from "@/lib/morphology/classify";

describe("classify", () => {
  it("classifies the three sample rows from the plan", () => {
    // 2:2:2:2  كِتَٰبُ  N  ROOT:كتب|LEM:كِتاب|M|NOM
    expect(classify("N", ["M", "NOM"])).toBe("noun");
    // 2:79:3:1  يَكْتُبُ  V  IMPF|VF:1|ROOT:كتب|LEM:كَتَبَ|3MP|MOOD:IND
    expect(classify("V", ["IMPF", "VF:1", "3MP", "MOOD:IND"])).toBe("verb.impf");
    // 1:1:3:2  رَّحْمَٰنِ  N  ROOT:رحم|LEM:رَحْمٰن|MS|GEN|ADJ
    expect(classify("N", ["MS", "GEN", "ADJ"])).toBe("adj");
  });

  it("classifies verb aspects", () => {
    expect(classify("V", ["PERF", "3MS"])).toBe("verb.perf");
    expect(classify("V", ["IMPF", "3MS"])).toBe("verb.impf");
    expect(classify("V", ["IMPV", "2MS"])).toBe("verb.impv");
  });

  it("classifies derivational noun categories", () => {
    expect(classify("N", ["PN"])).toBe("properNoun");
    expect(classify("N", ["ACT_PCPL", "MS", "NOM"])).toBe("actPcpl");
    expect(classify("N", ["PASS_PCPL", "MS", "NOM"])).toBe("passPcpl");
    expect(classify("N", ["VN", "NOM"])).toBe("verbalNoun");
  });

  it("falls back to plain noun for an unmarked N segment", () => {
    expect(classify("N", ["M", "GEN"])).toBe("noun");
  });

  it("falls back to other for an unclassifiable POS/tag combination", () => {
    expect(classify("T", ["ACC"])).toBe("other");
    expect(classify("V", [])).toBe("other");
  });
});

describe("extractVerbForm", () => {
  it("maps VF:n to the Roman numeral form", () => {
    expect(extractVerbForm(["IMPF", "VF:1", "3MP"])).toBe("I");
    expect(extractVerbForm(["PERF", "VF:4"])).toBe("IV");
    expect(extractVerbForm(["PERF", "VF:10"])).toBe("X");
  });

  it("returns null when there is no VF tag", () => {
    expect(extractVerbForm(["M", "NOM"])).toBeNull();
  });
});

describe("extractMood", () => {
  it("extracts the mood value", () => {
    expect(extractMood(["IMPF", "3MP", "MOOD:IND"])).toBe("IND");
    expect(extractMood(["IMPF", "MOOD:JUS"])).toBe("JUS");
  });

  it("returns null when there is no MOOD tag", () => {
    expect(extractMood(["PERF", "3MS"])).toBeNull();
  });
});
