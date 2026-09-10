import { altKeyFor, normalize, normalizeRootKey } from "../../src/lib/arabic/normalize";
import { classify, extractVerbForm } from "../../src/lib/morphology/classify";
import type {
  Cat,
  FormsEntry,
  IndexLemmaRow,
  IndexRootRow,
  RootFile,
  RootFormEntry,
  RootLemmaEntry,
} from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

export interface RootGlossSource {
  b: string; // buckwalter
  m: string; // meaning (English, after Lane's Lexicon)
  f?: number;
}

export type RootsGlossMap = Record<string, RootGlossSource>;

export interface BuildRootsResult {
  indexRoots: IndexRootRow[];
  indexLemmas: IndexLemmaRow[];
  rootFiles: Map<string, RootFile>; // keyed by root text (Arabic), emit to roots/{root}.json
  lemmaFiles: Map<string, RootFile>; // keyed by rootless lemma key, emit to lemmas/{key}.json
  formsEntries: FormsEntry[];
  unmappedGlossRoots: string[]; // roots present in morphology but missing a gloss
  unusedGlossRoots: string[]; // roots present in the gloss dataset but absent from morphology
  /** root text (Arabic) -> its index into indexRoots -- the same "rootIdx" used
   *  throughout the app (IndexLemmaRow.rootIdx, FormsEntry.rootIdx, etc).
   *  Exposed so build-verse-roots.ts can resolve rootIdx without recomputing
   *  the sort order itself. */
  rootTextToGlobalIdx: Map<string, number>;
}

function glossShortFrom(text: string, maxLen = 140): string {
  const trimmed = text.trim();
  const sentenceEnd = trimmed.search(/[.!?](\s|$)/);
  let short = sentenceEnd !== -1 ? trimmed.slice(0, sentenceEnd + 1) : trimmed;
  if (short.length > maxLen) {
    const cut = short.slice(0, maxLen - 1);
    const lastSpace = cut.lastIndexOf(" ");
    short = (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
  }
  return short;
}

function dominantCategory(cats: Map<Cat, number>): Cat {
  let best: Cat = "other";
  let bestCount = -1;
  for (const [cat, count] of cats) {
    if (count > bestCount) {
      best = cat;
      bestCount = count;
    }
  }
  return best;
}

// --- internal per-root aggregation shapes (before finalization) ---

interface RawLemmaAgg {
  lemma: string;
  key: string;
  pos: "N" | "V";
  count: number;
  cats: Map<Cat, number>;
  vf: Map<string, number> | undefined;
}

interface RawFormAgg {
  form: string;
  key: string;
  lemmaText: string;
  cat: Cat;
  count: number;
}

interface RawSegmentOcc {
  s: number;
  a: number;
  w: number;
  seg: number;
  form: string;
  tagsJoined: string;
}

interface RootAgg {
  lemmas: Map<string, RawLemmaAgg>;
  forms: Map<string, RawFormAgg>;
  featsSet: Set<string>;
  segments: RawSegmentOcc[];
}

interface RootlessLemmaAgg {
  lemma: string;
  key: string;
  pos: "N" | "V" | "P";
  count: number;
  cats: Map<Cat, number>;
  forms: Map<string, RawFormAgg>;
  featsSet: Set<string>;
  segments: RawSegmentOcc[];
}

/**
 * Aggregates every rooted (and rootless-but-lemmatized) morphological
 * segment across the whole corpus into per-root files, the global
 * autocomplete index, and the global forms index.
 */
export function buildRoots(words: readonly RawWord[], gloss: RootsGlossMap): BuildRootsResult {
  const rootAggs = new Map<string, RootAgg>();
  const rootlessAggs = new Map<string, RootlessLemmaAgg>();

  // --- Pass 1: aggregate ---
  for (const word of words) {
    for (const seg of word.segments) {
      if (seg.root !== null) {
        let agg = rootAggs.get(seg.root);
        if (!agg) {
          agg = { lemmas: new Map(), forms: new Map(), featsSet: new Set(), segments: [] };
          rootAggs.set(seg.root, agg);
        }

        const cat = classify(seg.pos, seg.tags);
        const lemmaText = seg.lemma ?? seg.form;

        let lemmaAgg = agg.lemmas.get(lemmaText);
        if (!lemmaAgg) {
          lemmaAgg = {
            lemma: lemmaText,
            key: normalize(lemmaText),
            pos: seg.pos === "V" ? "V" : "N",
            count: 0,
            cats: new Map(),
            vf: seg.pos === "V" ? new Map() : undefined,
          };
          agg.lemmas.set(lemmaText, lemmaAgg);
        }
        lemmaAgg.count++;
        lemmaAgg.cats.set(cat, (lemmaAgg.cats.get(cat) ?? 0) + 1);
        if (lemmaAgg.vf) {
          const vfLabel = extractVerbForm(seg.tags);
          if (vfLabel) lemmaAgg.vf.set(vfLabel, (lemmaAgg.vf.get(vfLabel) ?? 0) + 1);
        }

        let formAgg = agg.forms.get(seg.form);
        if (!formAgg) {
          formAgg = { form: seg.form, key: normalize(seg.form), lemmaText, cat, count: 0 };
          agg.forms.set(seg.form, formAgg);
        }
        formAgg.count++;

        const tagsJoined = seg.tags.join("|");
        agg.featsSet.add(tagsJoined);
        agg.segments.push({ s: seg.s, a: seg.a, w: seg.w, seg: seg.seg, form: seg.form, tagsJoined });
      } else if (seg.lemma !== null) {
        let entry = rootlessAggs.get(seg.lemma);
        if (!entry) {
          entry = {
            lemma: seg.lemma,
            key: normalize(seg.lemma),
            pos: seg.pos === "V" || seg.pos === "P" ? seg.pos : "N",
            count: 0,
            cats: new Map(),
            forms: new Map(),
            featsSet: new Set(),
            segments: [],
          };
          rootlessAggs.set(seg.lemma, entry);
        }
        entry.count++;

        const cat = classify(seg.pos, seg.tags);
        entry.cats.set(cat, (entry.cats.get(cat) ?? 0) + 1);

        let formAgg = entry.forms.get(seg.form);
        if (!formAgg) {
          formAgg = { form: seg.form, key: normalize(seg.form), lemmaText: seg.lemma, cat, count: 0 };
          entry.forms.set(seg.form, formAgg);
        }
        formAgg.count++;

        const tagsJoined = seg.tags.join("|");
        entry.featsSet.add(tagsJoined);
        entry.segments.push({ s: seg.s, a: seg.a, w: seg.w, seg: seg.seg, form: seg.form, tagsJoined });
      }
    }
  }

  // --- Pass 2: finalize per-root files ---
  const rootFiles = new Map<string, RootFile>();
  // per-root, keyed by root text -> (lemmaText -> local lemma index), needed to cross-reference
  // into the global forms index once global lemma indices are known.
  const perRootFormsWithLemmaText = new Map<string, { entry: RootFormEntry; lemmaText: string }[]>();

  const glossRootsUsed = new Set<string>();

  for (const [root, agg] of rootAggs) {
    const lemmasArr: RootLemmaEntry[] = [...agg.lemmas.values()]
      .sort((a, b) => b.count - a.count || a.lemma.localeCompare(b.lemma))
      .map((l) => ({
        lemma: l.lemma,
        key: l.key,
        pos: l.pos,
        count: l.count,
        cats: Object.fromEntries(l.cats) as Partial<Record<Cat, number>>,
        ...(l.vf && l.vf.size > 0 ? { vf: Object.fromEntries(l.vf) } : {}),
      }));
    const lemmaTextToLocalIdx = new Map(lemmasArr.map((l, i) => [l.lemma, i]));

    const formsArrWithLemmaText = [...agg.forms.values()]
      .sort((a, b) => b.count - a.count || a.form.localeCompare(b.form))
      .map((f) => ({
        entry: {
          form: f.form,
          key: f.key,
          lemmaIdx: lemmaTextToLocalIdx.get(f.lemmaText)!,
          cat: f.cat,
          count: f.count,
        } satisfies RootFormEntry,
        lemmaText: f.lemmaText,
      }));
    const formTextToLocalIdx = new Map(formsArrWithLemmaText.map((f, i) => [f.entry.form, i]));
    perRootFormsWithLemmaText.set(root, formsArrWithLemmaText);

    const featsArr = [...agg.featsSet].sort();
    const featsToIdx = new Map(featsArr.map((f, i) => [f, i]));

    const occ = agg.segments.map(
      (s) =>
        [s.s, s.a, s.w, s.seg, formTextToLocalIdx.get(s.form)!, featsToIdx.get(s.tagsJoined)!] as [
          number,
          number,
          number,
          number,
          number,
          number,
        ],
    );

    const g = gloss[root];
    if (g) glossRootsUsed.add(root);

    rootFiles.set(root, {
      root,
      ...(g ? { bw: g.b } : {}),
      ...(g ? { gloss: { en: g.m, short: glossShortFrom(g.m) } } : {}),
      total: occ.length,
      lemmas: lemmasArr,
      forms: formsArrWithLemmaText.map((f) => f.entry),
      feats: featsArr,
      occ,
    });
  }

  // --- Build global roots index (sorted by normalized root key) ---
  const sortedRoots = [...rootFiles.keys()].sort((a, b) =>
    normalizeRootKey(a).localeCompare(normalizeRootKey(b)),
  );
  const rootTextToGlobalIdx = new Map(sortedRoots.map((r, i) => [r, i]));

  const indexRoots: IndexRootRow[] = sortedRoots.map((root) => {
    const file = rootFiles.get(root)!;
    const verseSet = new Set<string>();
    for (const [s, a] of file.occ) verseSet.add(`${s}:${a}`);
    return {
      ar: root,
      key: normalizeRootKey(root),
      bw: file.bw ?? "",
      count: file.total,
      lemmaCount: file.lemmas.length,
      verseCount: verseSet.size,
      glossShort: file.gloss?.short ?? "",
    };
  });

  // --- Build global lemmas index (rooted + rootless), sorted by key ---
  interface GlobalLemmaBuild extends IndexLemmaRow {
    _rootText: string | null; // internal, stripped before returning if needed (kept: harmless extra field is fine at runtime but let's not leak it)
  }

  const rootedLemmaRows: GlobalLemmaBuild[] = [];
  for (const root of sortedRoots) {
    const file = rootFiles.get(root)!;
    const rootIdx = rootTextToGlobalIdx.get(root)!;
    for (const lemma of file.lemmas) {
      rootedLemmaRows.push({
        lemma: lemma.lemma,
        key: lemma.key,
        rootIdx,
        count: lemma.count,
        cat: dominantCategory(new Map(Object.entries(lemma.cats) as [Cat, number][])),
        _rootText: root,
      });
    }
  }

  const rootlessLemmaRows: GlobalLemmaBuild[] = [...rootlessAggs.values()]
    .sort((a, b) => b.count - a.count || a.lemma.localeCompare(b.lemma))
    .map((l) => ({
      lemma: l.lemma,
      key: l.key,
      rootIdx: -1,
      count: l.count,
      cat: dominantCategory(l.cats),
      _rootText: null,
    }));

  const allLemmaRows = [...rootedLemmaRows, ...rootlessLemmaRows].sort((a, b) => a.key.localeCompare(b.key));

  // lookup: composite "root lemma" -> global lemma index (rooted), " lemma" -> index (rootless)
  const globalLemmaLookup = new Map<string, number>();
  allLemmaRows.forEach((row, i) => {
    const compositeKey = row._rootText === null ? ` ${row.lemma}` : `${row._rootText} ${row.lemma}`;
    globalLemmaLookup.set(compositeKey, i);
  });

  const indexLemmas: IndexLemmaRow[] = allLemmaRows.map(({ lemma, key, rootIdx, count, cat }) => ({
    lemma,
    key,
    rootIdx,
    count,
    cat,
  }));

  // --- Build global forms index ---
  const formsEntries: FormsEntry[] = [];
  for (const root of sortedRoots) {
    const rootIdx = rootTextToGlobalIdx.get(root)!;
    for (const { entry, lemmaText } of perRootFormsWithLemmaText.get(root)!) {
      const lemmaIdx = globalLemmaLookup.get(`${root} ${lemmaText}`)!;
      formsEntries.push({
        key: entry.key,
        altKey: altKeyFor(entry.form),
        rootIdx,
        lemmaIdx,
        count: entry.count,
      });
    }
  }
  for (const l of rootlessAggs.values()) {
    const lemmaIdx = globalLemmaLookup.get(` ${l.lemma}`)!;
    for (const form of l.forms.values()) {
      formsEntries.push({
        key: form.key,
        altKey: altKeyFor(form.form),
        rootIdx: -1,
        lemmaIdx,
        count: form.count,
      });
    }
  }
  formsEntries.sort((a, b) => a.key.localeCompare(b.key));

  // --- Rootless lemma files (lemmas/{key}.json), root: null ---
  // Each rootless lemma gets a self-contained RootFile (root:null, exactly one
  // lemma at index 0) so its word page can render forms/occurrences the same
  // way a root page does.
  const lemmaFiles = new Map<string, RootFile>();
  for (const l of rootlessAggs.values()) {
    const formsArr: RootFormEntry[] = [...l.forms.values()]
      .sort((a, b) => b.count - a.count || a.form.localeCompare(b.form))
      .map((f) => ({ form: f.form, key: f.key, lemmaIdx: 0, cat: f.cat, count: f.count }));
    const formTextToIdx = new Map(formsArr.map((f, i) => [f.form, i]));

    const featsArr = [...l.featsSet].sort();
    const featsToIdx = new Map(featsArr.map((f, i) => [f, i]));

    const occ = l.segments.map(
      (s) =>
        [s.s, s.a, s.w, s.seg, formTextToIdx.get(s.form)!, featsToIdx.get(s.tagsJoined)!] as [
          number,
          number,
          number,
          number,
          number,
          number,
        ],
    );

    lemmaFiles.set(l.key, {
      root: null,
      total: l.count,
      lemmas: [
        {
          lemma: l.lemma,
          key: l.key,
          pos: l.pos,
          count: l.count,
          cats: Object.fromEntries(l.cats) as Partial<Record<Cat, number>>,
        },
      ],
      forms: formsArr,
      feats: featsArr,
      occ,
    });
  }

  const morphologyRoots = new Set(rootAggs.keys());
  const unmappedGlossRoots = [...morphologyRoots].filter((r) => !glossRootsUsed.has(r));
  const unusedGlossRoots = Object.keys(gloss).filter((r) => !morphologyRoots.has(r));

  return {
    indexRoots,
    indexLemmas,
    rootFiles,
    lemmaFiles,
    formsEntries,
    unmappedGlossRoots,
    unusedGlossRoots,
    rootTextToGlobalIdx,
  };
}
