import { letterCountOf, countLetters } from "../../src/lib/arabic/letterFrequency";
import type {
  IndexLemmaRow,
  IndexRootRow,
  InsightsFile,
  RootFile,
  SurahCoverageLemmaRow,
  SurahCoverageRootRow,
} from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

const TOP_N = 15;

/**
 * Computes corpus-wide curiosities from data buildRoots() and
 * parseMorphologyTSV() already produced -- see InsightsFile's doc comment
 * for why these are precomputed here rather than derived client-side.
 */
export function buildInsights(
  words: readonly RawWord[],
  rootFiles: ReadonlyMap<string, RootFile>,
  lemmaFiles: ReadonlyMap<string, RootFile>,
  indexRoots: readonly IndexRootRow[],
  indexLemmas: readonly IndexLemmaRow[],
  totalSurahs: number,
): InsightsFile {
  // --- roots ranked by distinct-surah coverage ---
  const rootRows: SurahCoverageRootRow[] = indexRoots.map((row) => {
    const file = rootFiles.get(row.ar)!;
    const surahCount = new Set(file.occ.map(([s]) => s)).size;
    return { ar: row.ar, glossShort: row.glossShort, surahCount, count: row.count };
  });
  rootRows.sort((a, b) => b.surahCount - a.surahCount || b.count - a.count || a.ar.localeCompare(b.ar));

  // --- lemmas (rooted + rootless) ranked by distinct-surah coverage ---
  const lemmaRows: SurahCoverageLemmaRow[] = [];
  for (const [root, file] of rootFiles) {
    const surahSets: Set<number>[] = file.lemmas.map(() => new Set());
    const counts: number[] = file.lemmas.map(() => 0);
    for (const [s, , , , formIdx] of file.occ) {
      const lemmaIdx = file.forms[formIdx].lemmaIdx;
      surahSets[lemmaIdx].add(s);
      counts[lemmaIdx]++;
    }
    file.lemmas.forEach((lemma, i) => {
      lemmaRows.push({ lemma: lemma.lemma, key: lemma.key, rootAr: root, surahCount: surahSets[i].size, count: counts[i] });
    });
  }
  for (const file of lemmaFiles.values()) {
    const lemma = file.lemmas[0];
    const surahCount = new Set(file.occ.map(([s]) => s)).size;
    lemmaRows.push({ lemma: lemma.lemma, key: lemma.key, rootAr: null, surahCount, count: file.total });
  }
  lemmaRows.sort((a, b) => b.surahCount - a.surahCount || b.count - a.count || a.lemma.localeCompare(b.lemma));

  // --- longest/shortest verse, by word count ---
  const verseWordCounts = new Map<string, { s: number; a: number; count: number }>();
  for (const word of words) {
    const key = `${word.s}:${word.a}`;
    const entry = verseWordCounts.get(key);
    if (entry) entry.count++;
    else verseWordCounts.set(key, { s: word.s, a: word.a, count: 1 });
  }
  let longestVerse = { s: 0, a: 0, wordCount: -1 };
  let shortestVerse = { s: 0, a: 0, wordCount: Number.POSITIVE_INFINITY };
  for (const { s, a, count } of verseWordCounts.values()) {
    if (count > longestVerse.wordCount) longestVerse = { s, a, wordCount: count };
    if (count < shortestVerse.wordCount) shortestVerse = { s, a, wordCount: count };
  }

  // --- longest word, by letter count (diacritics stripped) ---
  let longestWord = { s: 0, a: 0, w: 0, text: "", letterCount: -1 };
  for (const word of words) {
    const letterCount = letterCountOf(word.text);
    if (letterCount > longestWord.letterCount) {
      longestWord = { s: word.s, a: word.a, w: word.w, text: word.text, letterCount };
    }
  }

  // --- whole-Qur'an letter frequency ---
  const letterFrequency = countLetters(words.map((w) => w.text));

  // --- hapax legomena (occurring exactly once) ---
  const hapaxRootCount = indexRoots.filter((r) => r.count === 1).length;
  const hapaxLemmaCount = indexLemmas.filter((l) => l.count === 1).length;

  // --- root with the most distinct lemmas / surface forms ---
  let mostDerivedRoot = { ar: "", lemmaCount: -1 };
  for (const row of indexRoots) {
    if (row.lemmaCount > mostDerivedRoot.lemmaCount) mostDerivedRoot = { ar: row.ar, lemmaCount: row.lemmaCount };
  }
  let mostFormsRoot = { ar: "", formCount: -1 };
  for (const [root, file] of rootFiles) {
    if (file.forms.length > mostFormsRoot.formCount) mostFormsRoot = { ar: root, formCount: file.forms.length };
  }

  // --- verse touching the most distinct roots ---
  const rootsByVerse = new Map<string, { s: number; a: number; roots: Set<string> }>();
  for (const word of words) {
    for (const seg of word.segments) {
      if (seg.root === null) continue;
      const key = `${word.s}:${word.a}`;
      let entry = rootsByVerse.get(key);
      if (!entry) {
        entry = { s: word.s, a: word.a, roots: new Set() };
        rootsByVerse.set(key, entry);
      }
      entry.roots.add(seg.root);
    }
  }
  let mostRootDenseVerse = { s: 0, a: 0, distinctRootCount: -1 };
  for (const { s, a, roots } of rootsByVerse.values()) {
    if (roots.size > mostRootDenseVerse.distinctRootCount) {
      mostRootDenseVerse = { s, a, distinctRootCount: roots.size };
    }
  }

  return {
    totalSurahs,
    rootsBySurahCoverage: rootRows.slice(0, TOP_N),
    lemmasBySurahCoverage: lemmaRows.slice(0, TOP_N),
    longestVerse,
    shortestVerse,
    longestWord,
    letterFrequency,
    hapaxRootCount,
    hapaxLemmaCount,
    mostDerivedRoot,
    mostFormsRoot,
    mostRootDenseVerse,
  };
}
