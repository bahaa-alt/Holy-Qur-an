import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildRoots } from "../../scripts/lib/build-roots";
import { buildConjugationTables, hasVerbLemma } from "@/lib/root/conjugation";

// Form I perfect (no VF: tag -- must default to Form I), Form I imperfect
// indicative and jussive (same lemma/PGN, different mood -- must appear as
// two distinct ConjugationForms in the same cell), and Form IV imperfect.
const KATABA_VERB_ROWS = [
  "2:1:1:1\tكَتَبَ\tV\tPERF|ROOT:كتب|LEM:كَتَبَ|3MS",
  "2:2:1:1\tيَكْتُبُ\tV\tIMPF|VF:1|ROOT:كتب|LEM:كَتَبَ|3MP|MOOD:IND",
  "2:3:1:1\tيَكْتُبْ\tV\tIMPF|VF:1|ROOT:كتب|LEM:كَتَبَ|3MP|MOOD:JUS",
  "2:4:1:1\tيُكْتِبُ\tV\tIMPF|VF:4|ROOT:كتب|LEM:أَكْتَبَ|3MP|MOOD:IND",
].join("\n");

const NOUN_ONLY_ROWS = ["2:2:2:2\tكِتَٰبُ\tN\tROOT:كتب|LEM:كِتاب|M|NOM"].join("\n");

function katabaFile() {
  const words = parseMorphologyTSV(KATABA_VERB_ROWS);
  return buildRoots(words, {}).rootFiles.get("كتب")!;
}

function nounOnlyFile() {
  const words = parseMorphologyTSV(NOUN_ONLY_ROWS);
  return buildRoots(words, {}).rootFiles.get("كتب")!;
}

describe("hasVerbLemma", () => {
  it("is true for a root with at least one verb lemma", () => {
    expect(hasVerbLemma(katabaFile())).toBe(true);
  });

  it("is false for a root with only noun lemmas", () => {
    expect(hasVerbLemma(nounOnlyFile())).toBe(false);
  });
});

describe("buildConjugationTables", () => {
  const tables = buildConjugationTables(katabaFile());

  it("returns one table per attested verb Form, in Form order", () => {
    expect(tables.map((t) => t.verbForm)).toEqual(["I", "IV"]);
  });

  it("defaults a verb with no VF: tag to Form I", () => {
    const formI = tables.find((t) => t.verbForm === "I")!;
    const perfRow = formI.rows.find((r) => r.aspect === "verb.perf")!;
    expect(perfRow.cells).toHaveLength(1);
    expect(perfRow.cells[0].pgn).toBe("3MS");
    expect(perfRow.cells[0].total).toBe(1);
  });

  it("groups same Form+aspect+PGN occurrences differing only by mood into one cell, as separate forms", () => {
    const formI = tables.find((t) => t.verbForm === "I")!;
    const impfRow = formI.rows.find((r) => r.aspect === "verb.impf")!;
    expect(impfRow.cells).toHaveLength(1);
    const cell = impfRow.cells[0];
    expect(cell.pgn).toBe("3MP");
    expect(cell.total).toBe(2);
    expect(cell.forms).toHaveLength(2);
    expect(cell.forms.map((f) => f.mood).sort()).toEqual(["IND", "JUS"]);
  });

  it("keeps a different verb Form as a separate table", () => {
    const formIV = tables.find((t) => t.verbForm === "IV")!;
    expect(formIV.total).toBe(1);
    const impfRow = formIV.rows.find((r) => r.aspect === "verb.impf")!;
    expect(impfRow.cells[0].pgn).toBe("3MP");
    expect(impfRow.cells[0].forms[0].form).toBe("يُكْتِبُ");
  });

  it("returns an empty array for a root with no verb lemmas", () => {
    expect(buildConjugationTables(nounOnlyFile())).toEqual([]);
  });
});
