import { letterCountOf, countLetters } from "../../src/lib/arabic/letterFrequency";
import type {
  IndexLemmaRow,
  IndexRootRow,
  InsightsFile,
  RootFile,
  SurahCoverageLemmaRow,
  SurahCoverageRootRow,
  SurahFile,
} from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

const TOP_N = 15;

/**
 * Computes corpus-wide curiosities from data buildRoots() and
 * parseMorphologyTSV() already produced -- see InsightsFile's doc comment
 * for why these are precomputed here rather than derived client-side.
 *
 * letterFrequency and longestWord read each word's text from `surahFiles`
 * (buildSurahs()'s output: the canonical quran-json spelling, the same
 * text every verse/search/root page displays and every scoped Letter
 * Frequency view already counts from), not from `words[].text` (the
 * morphology corpus's own reconstruction). The two disagree on two
 * systematic, real spelling conventions -- word-final /i:/ as ى vs ي, and
 * a decomposed ء+ا vs precomposed أ -- affecting roughly half of all
 * words at the diacritics-stripped level; using morphology's spelling
 * here previously meant this app's own single corpus-wide letter count,
 * and the exact text of its "longest word" fact, wouldn't match the
 * canonical spelling shown on that very word's own verse page one click
 * away. buildSurahs() already resolves the 10 verses where the two
 * sources' word counts disagree by falling back to the morphology
 * reconstruction there, so reading through `surahFiles` here needs no
 * special-casing for that.
 */
export function buildInsights(
  words: readonly RawWord[],
  rootFiles: ReadonlyMap<string, RootFile>,
  lemmaFiles: ReadonlyMap<string, RootFile>,
  indexRoots: readonly IndexRootRow[],
  indexLemmas: readonly IndexLemmaRow[],
  totalSurahs: number,
  surahFiles: ReadonlyMap<number, SurahFile>,
): InsightsFile {
  const verseByRef = new Map<string, SurahFile["verses"][number]>();
  for (const file of surahFiles.values()) {
    for (const verse of file.verses) verseByRef.set(`${file.n}:${verse.a}`, verse);
  }
  const canonicalWord = (s: number, a: number, w: number): string =>
    verseByRef.get(`${s}:${a}`)!.w[w - 1];
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
    const text = canonicalWord(word.s, word.a, word.w);
    const letterCount = letterCountOf(text);
    if (letterCount > longestWord.letterCount) {
      longestWord = { s: word.s, a: word.a, w: word.w, text, letterCount };
    }
  }

  // --- whole-Qur'an letter frequency ---
  const letterFrequency = countLetters(
    words.map((w) => canonicalWord(w.s, w.a, w.w)),
  );

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
  // Ranked by density (distinct roots ÷ word count), not raw count -- raw
  // count just picks out the longest verse again (2:282, already reported
  // as longestVerse), telling nothing new. A minimum word count keeps a
  // trivial short verse (e.g. one word, one root -> density 1.0) from
  // "winning" without actually being notable.
  const MIN_WORDS_FOR_DENSITY = 10;
  let mostRootDenseVerse = { s: 0, a: 0, distinctRootCount: -1, wordCount: 0, density: -1 };
  for (const { s, a, roots } of rootsByVerse.values()) {
    const wordCount = verseWordCounts.get(`${s}:${a}`)?.count ?? 0;
    if (wordCount < MIN_WORDS_FOR_DENSITY) continue;
    const density = roots.size / wordCount;
    if (density > mostRootDenseVerse.density) {
      mostRootDenseVerse = { s, a, distinctRootCount: roots.size, wordCount, density };
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
