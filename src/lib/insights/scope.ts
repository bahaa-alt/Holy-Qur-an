import { CHRONOLOGICAL_ORDER_BY_SURAH } from "@/lib/data/chronologicalOrder";
import { juzForVerse } from "@/lib/quran/juz";
import type { MetaFile } from "@/lib/data/types";

/**
 * A slice of the Qur'an to study, and everything else as its baseline.
 *
 * THE IDEA THE OLD /insights/ WAS MISSING. Every number it showed was a
 * count over the whole book: most frequent letter, longest verse, top
 * fifteen roots by coverage. A count with no comparison cannot answer a
 * research question, because the question is always "compared to what".
 * A scope makes the comparison explicit: these verses, against the rest.
 *
 * The chronological scope is the one that matters most and the one the
 * app never used, though the data has been here all along: the standard
 * revelation order is in chronologicalOrder.ts, and it is the independent
 * variable most Qur'anic scholarship is actually interested in.
 */
export type Scope =
  | { kind: "quran" }
  | { kind: "surah"; n: number }
  | { kind: "juz"; n: number }
  | { kind: "revelation"; value: "meccan" | "medinan" }
  /** by position in revelation order, 1-114 inclusive */
  | { kind: "chrono"; from: number; to: number };

/** A verse's coordinates, in the order verse-roots.json stores them. */
export interface VerseRef {
  s: number;
  a: number;
}

/**
 * Every verse in corpus order, index-aligned with verse-roots.json.
 *
 * Derived from meta.json's ayah counts rather than shipped, exactly as
 * verseId.ts does it -- these are the same global ids, materialized once
 * so a scope pass is an array walk instead of 6,236 linear searches.
 */
export function buildVerseRefs(meta: MetaFile): VerseRef[] {
  const refs: VerseRef[] = [];
  for (const surah of meta.surahs) {
    for (let a = 1; a <= surah.ayahs; a++) refs.push({ s: surah.n, a });
  }
  return refs;
}

/** Whether a verse falls inside the scope. */
export function inScope(scope: Scope, ref: VerseRef): boolean {
  switch (scope.kind) {
    case "quran":
      return true;
    case "surah":
      return ref.s === scope.n;
    case "juz":
      return juzForVerse(ref.s, ref.a) === scope.n;
    case "revelation": {
      // Positions 1-86 are Meccan, 87-114 Medinan (chronologicalOrder.ts).
      const position = CHRONOLOGICAL_ORDER_BY_SURAH[ref.s - 1];
      return scope.value === "meccan" ? position <= 86 : position > 86;
    }
    case "chrono": {
      const position = CHRONOLOGICAL_ORDER_BY_SURAH[ref.s - 1];
      return position >= scope.from && position <= scope.to;
    }
  }
}

/** A stable string for a scope, for URLs and React keys. */
export function scopeToParam(scope: Scope): string {
  switch (scope.kind) {
    case "quran":
      return "quran";
    case "surah":
      return `surah:${scope.n}`;
    case "juz":
      return `juz:${scope.n}`;
    case "revelation":
      return scope.value;
    case "chrono":
      return `chrono:${scope.from}-${scope.to}`;
  }
}

/** Parses what scopeToParam wrote; returns null for anything else. */
export function scopeFromParam(param: string | null): Scope | null {
  if (!param) return null;
  if (param === "quran") return { kind: "quran" };
  if (param === "meccan" || param === "medinan") return { kind: "revelation", value: param };

  const surah = /^surah:(\d{1,3})$/.exec(param);
  if (surah) {
    const n = Number(surah[1]);
    return n >= 1 && n <= 114 ? { kind: "surah", n } : null;
  }
  const juz = /^juz:(\d{1,2})$/.exec(param);
  if (juz) {
    const n = Number(juz[1]);
    return n >= 1 && n <= 30 ? { kind: "juz", n } : null;
  }
  const chrono = /^chrono:(\d{1,3})-(\d{1,3})$/.exec(param);
  if (chrono) {
    const from = Number(chrono[1]);
    const to = Number(chrono[2]);
    const valid = from >= 1 && to <= 114 && from <= to;
    return valid ? { kind: "chrono", from, to } : null;
  }
  return null;
}

/**
 * The QCQL a scope corresponds to, so a keyness row can hand the reader a
 * runnable query rather than a number they have to take on trust.
 *
 * Returns null where v1 of the language cannot express the scope: a juz
 * crosses surah boundaries mid-surah, and QCQL filters whole surahs.
 */
export function scopeToQcqlFilter(scope: Scope): string | null {
  switch (scope.kind) {
    case "quran":
      return "";
    case "surah":
      return `surah = ${scope.n}`;
    case "revelation":
      return scope.value;
    case "chrono":
      return scope.from === scope.to
        ? `chrono = ${scope.from}`
        : `chrono >= ${scope.from} & chrono <= ${scope.to}`;
    case "juz":
      return null;
  }
}
