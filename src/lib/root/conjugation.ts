import type { Cat, RootFile } from "@/lib/data/types";
import { ROMAN_FORMS, extractMood, extractPersonGenderNumber, extractVerbForm } from "@/lib/morphology/classify";
import { describeTag } from "@/lib/morphology/tagLabels";

export interface ConjugationForm {
  form: string;
  formKey: string;
  lemmaKey: string;
  mood: string | null;
  count: number;
}

export interface ConjugationCell {
  pgn: string | null;
  pgnLabel: string;
  forms: ConjugationForm[];
  total: number;
}

export interface ConjugationRow {
  aspect: "verb.perf" | "verb.impf" | "verb.impv";
  cells: ConjugationCell[];
}

export interface ConjugationTableData {
  verbForm: string;
  rows: ConjugationRow[];
  total: number;
}

export function hasVerbLemma(file: RootFile): boolean {
  return file.lemmas.some((l) => l.pos === "V");
}

// A tuple of literal types (not `readonly Cat[]`) so iterating it below
// narrows `aspect` to exactly ConjugationRow's aspect union.
const VERB_ASPECTS = ["verb.perf", "verb.impf", "verb.impv"] as const;
const VERB_ASPECT_SET = new Set<Cat>(VERB_ASPECTS);
// Insertion order of numeric-string keys "1".."11" is ascending numeric in JS,
// so this is exactly ["I", "II", ..., "XI"] -- reuses classify.ts's own map
// instead of a second hardcoded ordering.
const FORM_ORDER = Object.values(ROMAN_FORMS);

const PERSON_WEIGHT: Record<string, number> = { "1": 1, "2": 2, "3": 3 };
const GENDER_WEIGHT: Record<string, number> = { M: 1, F: 2 };
const NUMBER_WEIGHT: Record<string, number> = { S: 1, D: 2, P: 3 };

/** Decodes a PGN tag's components into a sortable (person, gender, number) tuple. */
function pgnSortKey(pgn: string | null): [number, number, number] {
  if (!pgn) return [0, 0, 0];
  let person = 0;
  let gender = 0;
  let number = 0;
  for (const ch of pgn) {
    if (PERSON_WEIGHT[ch] !== undefined) person = PERSON_WEIGHT[ch];
    else if (GENDER_WEIGHT[ch] !== undefined) gender = GENDER_WEIGHT[ch];
    else if (NUMBER_WEIGHT[ch] !== undefined) number = NUMBER_WEIGHT[ch];
  }
  return [person, gender, number];
}

function comparePgn(a: string | null, b: string | null): number {
  const ka = pgnSortKey(a);
  const kb = pgnSortKey(b);
  return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
}

interface FormAgg {
  form: string;
  formKey: string;
  lemmaKey: string;
  mood: string | null;
  count: number;
}

/**
 * Builds a Form / aspect / person-gender-number breakdown of a root's verb
 * occurrences, built directly from `file.occ` (not the pre-aggregated
 * RootFormEntry.count) since one form entry can span multiple mood/PGN
 * combinations this table must distinguish.
 */
export function buildConjugationTables(file: RootFile): ConjugationTableData[] {
  // verbForm -> aspect -> pgn ("" for none) -> "formKey|mood" -> aggregate
  const tables = new Map<string, Map<Cat, Map<string, Map<string, FormAgg>>>>();

  for (const [, , , , formIdx, featIdx] of file.occ) {
    const form = file.forms[formIdx];
    if (!VERB_ASPECT_SET.has(form.cat)) continue;
    const lemma = file.lemmas[form.lemmaIdx];
    if (lemma.pos !== "V") continue;

    const tags = (file.feats[featIdx] ?? "").split("|").filter((t) => t !== "");
    const verbForm = extractVerbForm(tags) ?? "I";
    const pgn = extractPersonGenderNumber(tags);
    const mood = extractMood(tags);
    const pgnKey = pgn ?? "";
    const aggKey = `${form.key}|${mood ?? ""}`;

    let byAspect = tables.get(verbForm);
    if (!byAspect) {
      byAspect = new Map();
      tables.set(verbForm, byAspect);
    }
    let byPgn = byAspect.get(form.cat);
    if (!byPgn) {
      byPgn = new Map();
      byAspect.set(form.cat, byPgn);
    }
    let byAgg = byPgn.get(pgnKey);
    if (!byAgg) {
      byAgg = new Map();
      byPgn.set(pgnKey, byAgg);
    }
    let agg = byAgg.get(aggKey);
    if (!agg) {
      agg = { form: form.form, formKey: form.key, lemmaKey: lemma.key, mood, count: 0 };
      byAgg.set(aggKey, agg);
    }
    agg.count++;
  }

  const result: ConjugationTableData[] = [];
  for (const verbForm of FORM_ORDER) {
    const byAspect = tables.get(verbForm);
    if (!byAspect) continue;

    const rows: ConjugationRow[] = [];
    let tableTotal = 0;
    for (const aspect of VERB_ASPECTS) {
      const byPgn = byAspect.get(aspect);
      if (!byPgn) continue;

      const cells: ConjugationCell[] = [...byPgn.entries()]
        .map(([pgnKey, byAgg]) => {
          const pgn = pgnKey === "" ? null : pgnKey;
          const forms = [...byAgg.values()].sort((a, b) => b.count - a.count);
          const total = forms.reduce((sum, f) => sum + f.count, 0);
          return { pgn, pgnLabel: pgn ? describeTag(pgn).en : "Unspecified", forms, total };
        })
        .sort((a, b) => comparePgn(a.pgn, b.pgn));

      const rowTotal = cells.reduce((sum, c) => sum + c.total, 0);
      tableTotal += rowTotal;
      rows.push({ aspect, cells });
    }
    result.push({ verbForm, rows, total: tableTotal });
  }
  return result;
}
