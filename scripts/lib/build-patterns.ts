import { classify, extractVerbForm, ROMAN_FORMS } from "../../src/lib/morphology/classify";
import { classifyRootShape, ROOT_SHAPE_ORDER } from "../../src/lib/morphology/rootShape";
import { CATEGORY_ORDER } from "../../src/lib/data/types";
import type { Cat, CategoryStatRow, PatternsFile, RootShapeStatRow, VerbFormStatRow } from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

// Reverse of classify.ts's ROMAN_FORMS ("1" -> "I", ...), so a verb Form
// label recovered from the tags can be turned back into its numeric code
// for sorting/display without a second hardcoded table.
const NUM_FOR_ROMAN: Record<string, number> = Object.fromEntries(
  Object.entries(ROMAN_FORMS).map(([n, roman]) => [roman, Number(n)]),
);

interface VerbFormAgg {
  count: number;
  roots: Set<string>;
  lemmas: Set<string>;
}
interface CatAgg {
  count: number;
  roots: Set<string>;
}
interface ShapeAgg {
  count: number;
  roots: Set<string>;
}

/**
 * Aggregates corpus-wide morphological "pattern" productivity: which verb
 * Forms (I-XI), derivational categories, and root shapes (see
 * src/lib/morphology/rootShape.ts) are attested how often across ALL
 * roots. Distinct from any single root's own FormsTable/ConjugationTable --
 * this is a cross-root view for studying which grammatical patterns are
 * common or rare in the language as a whole, not within one root's meaning.
 * Powers /insights/'s Patterns tab.
 */
export function buildPatterns(words: readonly RawWord[]): PatternsFile {
  const verbFormAgg = new Map<number, VerbFormAgg>();
  const catAgg = new Map<Cat, CatAgg>();
  const shapeAgg = new Map<string, ShapeAgg>();

  for (const word of words) {
    for (const seg of word.segments) {
      if (seg.root === null) continue;
      const cat = classify(seg.pos, seg.tags);

      let c = catAgg.get(cat);
      if (!c) {
        c = { count: 0, roots: new Set() };
        catAgg.set(cat, c);
      }
      c.count++;
      c.roots.add(seg.root);

      const shape = classifyRootShape(seg.root);
      let s = shapeAgg.get(shape);
      if (!s) {
        s = { count: 0, roots: new Set() };
        shapeAgg.set(shape, s);
      }
      s.count++;
      s.roots.add(seg.root);

      if (seg.pos === "V") {
        // An untagged verb (no VF: feature) is a bare/Form I verb -- same
        // default src/lib/root/conjugation.ts already applies for its
        // per-root ConjugationTable, kept consistent here.
        const roman = extractVerbForm(seg.tags) ?? "I";
        const formNum = NUM_FOR_ROMAN[roman] ?? 1;
        let v = verbFormAgg.get(formNum);
        if (!v) {
          v = { count: 0, roots: new Set(), lemmas: new Set() };
          verbFormAgg.set(formNum, v);
        }
        v.count++;
        v.roots.add(seg.root);
        v.lemmas.add(`${seg.root}|${seg.lemma ?? seg.form}`);
      }
    }
  }

  const verbForms: VerbFormStatRow[] = [...verbFormAgg.entries()]
    .sort(([a], [b]) => a - b)
    .map(([form, agg]) => ({ form, count: agg.count, rootCount: agg.roots.size, lemmaCount: agg.lemmas.size }));

  const categories: CategoryStatRow[] = CATEGORY_ORDER.filter((cat) => catAgg.has(cat)).map((cat) => {
    const agg = catAgg.get(cat)!;
    return { cat, count: agg.count, rootCount: agg.roots.size };
  });

  const rootShapes: RootShapeStatRow[] = ROOT_SHAPE_ORDER.filter((shape) => shapeAgg.has(shape)).map((shape) => {
    const agg = shapeAgg.get(shape)!;
    return { shape, count: agg.count, rootCount: agg.roots.size };
  });

  return { verbForms, categories, rootShapes };
}
