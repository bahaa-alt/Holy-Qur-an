import { describe, expect, it } from "vitest";
import { relLabelEn } from "@/lib/treebank/relLabels";

describe("relLabelEn", () => {
  it("glosses the core relation codes", () => {
    expect(relLabelEn("gen")).toBe("genitive (after a preposition)");
    expect(relLabelEn("Poss")).toBe("possessive (muḍāf ilayh)");
    expect(relLabelEn("Subj")).toBe("subject");
    expect(relLabelEn("root")).toContain("no head");
  });

  it("glosses the subj/pred <<particle>> family generically, spaced or not", () => {
    expect(relLabelEn("subj <<kan>>")).toBe('subject of "kan"');
    expect(relLabelEn("pred <<ykon>>")).toBe('predicate of "ykon"');
    expect(relLabelEn("pred<<an>>")).toBe('predicate of "an"');
    expect(relLabelEn("subj<<en>>")).toBe('subject of "en"');
  });

  it("falls back to the raw code for anything unrecognized", () => {
    expect(relLabelEn("totally-unknown-code")).toBe("totally-unknown-code");
  });

  // Every relation code actually present in a real corpus build (extracted
  // from public/data/v1/treebank/*.json's distinct e.rel values) --
  // hardcoded here rather than read from the build output, so this test
  // runs on a fresh clone. Regression guard: a real build must never
  // produce a code this function can't gloss.
  const REAL_CODES = [
    "Adj", "App", "Cpnd", "NonRel", "Obj", "Pass", "Poss", "Pred", "Pro", "Spec", "Subj",
    "amd", "ans", "avr", "caus", "cert", "circ", "cog", "cond", "conj", "emph", "eq",
    "exh", "exl", "exp", "fut", "gen", "impv", "imrs", "inc", "int", "intg", "link",
    "neg", "prev", "prp", "res", "ret", "root", "rslt", "state", "sub", "sup", "sur", "voc",
    "pred <<akad>>", "pred <<akn>>", "pred <<akon>>", "pred <<asbah>>", "pred <<asbaht>>",
    "pred <<barah>>", "pred <<dm>>", "pred <<easaa>>", "pred <<ka'ana>>", "pred <<ka>>",
    "pred <<kad>>", "pred <<kan>>", "pred <<kant>>", "pred <<kn>>", "pred <<kon>>",
    "pred <<la>>", "pred <<lakin>>", "pred <<lakun>>", "pred <<las>>", "pred <<lays>>",
    "pred <<layt>>", "pred <<lel>>", "pred <<ma>>", "pred <<nkn>>", "pred <<nko>>",
    "pred <<nkon>>", "pred <<tafta'>>", "pred <<tk>>", "pred <<tkad>>", "pred <<tkn>>",
    "pred <<tkon>>", "pred <<tusbih>>", "pred <<yazal>>", "pred <<yk>>", "pred <<ykad>>",
    "pred <<ykn>>", "pred <<ykon>>", "pred <<ysbah>>", "pred <<zala>>", "pred<<an>>",
    "pred<<in>>", "subj <<asbah>>", "subj <<dam>>", "subj <<dm>>", "subj <<easaa>>",
    "subj <<ka'ana>>", "subj <<ka>>", "subj <<kad>>", "subj <<kan>>", "subj <<kant>>",
    "subj <<kn>>", "subj <<kon>>", "subj <<la>>", "subj <<lakin>>", "subj <<lakun>>",
    "subj <<las>>", "subj <<lays>>", "subj <<layst>>", "subj <<layt>>", "subj <<lel>>",
    "subj <<ma>>", "subj <<nkon>>", "subj <<tkad>>", "subj <<tkn>>", "subj <<tknm>>",
    "subj <<tkon>>", "subj <<yazal>>", "subj <<yk>>", "subj <<ykad>>", "subj <<ykn>>",
    "subj <<ykon>>", "subj <<ysbah>>", "subj <<zala>>", "subj<<an>>", "subj<<en>>",
    "subj<<in>>",
  ];

  it("glosses every relation code a real corpus build actually produces", () => {
    for (const code of REAL_CODES) {
      expect(relLabelEn(code), `code "${code}"`).not.toBe(code);
    }
  });
});
