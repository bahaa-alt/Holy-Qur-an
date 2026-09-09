/**
 * Parses the quran-morphology.txt TSV format into words grouped by verse.
 *
 * Row format (tab-separated): `surah:ayah:word:segment  form  POS  feats`
 * where `feats` is a pipe-delimited list mixing bare tags (e.g. "PERF",
 * "3MS") and key:value tags (e.g. "ROOT:كتب", "LEM:كِتاب", "VF:1",
 * "MOOD:IND"). See PLAN.md "Data layer" for the full tag vocabulary.
 */

export interface RawSegment {
  s: number;
  a: number;
  w: number;
  seg: number;
  form: string;
  pos: string;
  root: string | null;
  lemma: string | null;
  /** feats with ROOT:/LEM: entries removed, in file order */
  tags: string[];
}

export interface RawWord {
  s: number;
  a: number;
  w: number;
  /** the whole word, reconstructed by joining segment forms in order */
  text: string;
  segments: RawSegment[];
}

function parseFeats(featsStr: string): { root: string | null; lemma: string | null; tags: string[] } {
  let root: string | null = null;
  let lemma: string | null = null;
  const tags: string[] = [];

  for (const feat of featsStr.split("|")) {
    if (feat === "") continue;
    if (feat.startsWith("ROOT:")) {
      root = feat.slice("ROOT:".length);
    } else if (feat.startsWith("LEM:")) {
      lemma = feat.slice("LEM:".length);
    } else {
      tags.push(feat);
    }
  }

  return { root, lemma, tags };
}

/**
 * Parses the raw TSV text into a flat, verse-ordered list of words, each
 * with its constituent segments. Assumes (and does not re-sort) that the
 * source file is already in surah:ayah:word:segment order, which holds for
 * quran-morphology.txt.
 */
export function parseMorphologyTSV(text: string): RawWord[] {
  const words: RawWord[] = [];
  let current: RawWord | null = null;

  for (const line of text.split("\n")) {
    if (line.trim() === "") continue;

    const tab1 = line.indexOf("\t");
    const tab2 = line.indexOf("\t", tab1 + 1);
    const tab3 = line.indexOf("\t", tab2 + 1);
    if (tab1 === -1 || tab2 === -1 || tab3 === -1) {
      throw new Error(`Malformed morphology line (expected 4 tab-separated fields): ${line}`);
    }

    const ref = line.slice(0, tab1);
    const form = line.slice(tab1 + 1, tab2);
    const pos = line.slice(tab2 + 1, tab3);
    const featsStr = line.slice(tab3 + 1);

    const [sStr, aStr, wStr, segStr] = ref.split(":");
    const s = Number(sStr);
    const a = Number(aStr);
    const w = Number(wStr);
    const seg = Number(segStr);
    if (!Number.isInteger(s) || !Number.isInteger(a) || !Number.isInteger(w) || !Number.isInteger(seg)) {
      throw new Error(`Malformed reference "${ref}" on line: ${line}`);
    }

    const { root, lemma, tags } = parseFeats(featsStr);
    const segment: RawSegment = { s, a, w, seg, form, pos, root, lemma, tags };

    if (current && current.s === s && current.a === a && current.w === w) {
      current.text += form;
      current.segments.push(segment);
    } else {
      current = { s, a, w, text: form, segments: [segment] };
      words.push(current);
    }
  }

  return words;
}
