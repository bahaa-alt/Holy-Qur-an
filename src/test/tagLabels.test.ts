import { describe, expect, it } from "vitest";
import { describeTag, describeTags } from "@/lib/morphology/tagLabels";

// The full, exact set of 82 bare tags present in quran-morphology.txt
// (verified against the downloaded corpus; POS letters N/V/P are a separate
// field and not part of this list).
const REAL_BARE_TAGS = [
  "1P", "1S", "2D", "2FD", "2FP", "2FS", "2MD", "2MP", "2MS", "3D", "3FD", "3FP", "3FS", "3MD",
  "3MP", "3MS", "ACC", "ACT_PCPL", "ADDR", "ADJ", "AMD", "ANS", "ATT", "AVR", "CAUS", "CERT",
  "CIRC", "COM", "COND", "CONJ", "D", "DEM", "DET", "DIST", "EMPH", "EQ", "EXH", "EXL", "EXP", "F",
  "FD", "FP", "FS", "FUT", "GEN", "IMPF", "IMPV", "INC", "INDEF", "INL", "INT", "INTG", "LOC", "M",
  "MD", "MP", "MS", "NEG", "NOM", "NV", "P", "PASS", "PASS_PCPL", "PERF", "PN", "PREF", "PREV",
  "PRO", "PRON", "PRP", "REL", "REM", "RES", "RET", "RSLT", "SUB", "SUFF", "SUP", "SUR", "T", "VN",
  "VOC",
];

describe("describeTag", () => {
  it("resolves every real bare tag in the corpus to a non-fallback label", () => {
    for (const tag of REAL_BARE_TAGS) {
      const label = describeTag(tag);
      expect(label.en, `tag "${tag}" fell back to itself`).not.toBe(tag);
      expect(label.ar.length).toBeGreaterThan(0);
    }
  });

  it("decomposes person/gender/number codes", () => {
    expect(describeTag("3MP")).toEqual({ en: "3rd person, masculine, plural", ar: "غائب، مذكر، جمع" });
    expect(describeTag("2FS")).toEqual({ en: "2nd person, feminine, singular", ar: "مخاطب، مؤنث، مفرد" });
    expect(describeTag("MS")).toEqual({ en: "masculine, singular", ar: "مذكر، مفرد" });
    expect(describeTag("D")).toEqual({ en: "dual", ar: "مثنى" });
  });

  it("describes ROOT:/LEM: key-value tags", () => {
    expect(describeTag("ROOT:كتب")).toEqual({ en: "Root: كتب", ar: "الجذر: كتب" });
    expect(describeTag("LEM:كِتاب")).toEqual({ en: "Lemma: كِتاب", ar: "الصيغة: كِتاب" });
  });

  it("describes MOOD: by reusing the mood's own label", () => {
    const mood = describeTag("MOOD:IND");
    expect(mood.en).toContain("Indicative");
    expect(mood.ar).toContain("مرفوع");
  });

  it("describes VF: with the Roman-numeral verb form", () => {
    expect(describeTag("VF:1").en).toContain("I");
    expect(describeTag("VF:4").en).toContain("IV");
    expect(describeTag("VF:10").en).toContain("X");
  });

  it("describes FAM: with the sisters-family gloss", () => {
    expect(describeTag("FAM:كَان").en).toContain("kana");
    expect(describeTag("FAM:إِنّ").en).toContain("inna");
    expect(describeTag("FAM:كَاد").en).toContain("kada");
  });

  it("falls back to the raw tag for something genuinely unknown", () => {
    expect(describeTag("NOT_A_REAL_TAG")).toEqual({ en: "NOT_A_REAL_TAG", ar: "NOT_A_REAL_TAG" });
  });
});

describe("describeTags", () => {
  it("splits a pipe-delimited feats string into individual labels", () => {
    const labels = describeTags("IMPF|VF:1|3MP|MOOD:IND");
    expect(labels).toHaveLength(4);
    expect(labels[0].en).toContain("Imperfect");
    expect(labels[2].en).toContain("plural");
  });

  it("returns an empty array for an empty string", () => {
    expect(describeTags("")).toEqual([]);
  });
});
