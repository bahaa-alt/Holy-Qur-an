import type { ManifestMismatch, MetaFile, SurahFile, SurahVerse } from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

export interface QuranJsonVerse {
  id: number;
  text: string;
  translation: string;
  transliteration: string;
}

export interface QuranJsonChapter {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: string;
  total_verses: number;
  verses: QuranJsonVerse[];
}

export interface BuildSurahsResult {
  surahFiles: Map<number, SurahFile>;
  meta: MetaFile;
  mismatches: ManifestMismatch[];
}

/**
 * Groups parsed morphology words into (surah, ayah) buckets, reconciles them
 * against the canonical quran-json chapter text, and emits one SurahFile per
 * surah plus corpus-wide metadata.
 *
 * For each verse: if the morphology word count matches the quran-json
 * whitespace-token count, the quran-json tokens (canonical Uthmani text) are
 * used for display and the word index recorded in every occurrence aligns
 * positionally between the two sources. On a mismatch (pause marks, sajdah
 * signs, muqatta'at handled differently between the two datasets), the
 * morphology-reconstructed words are used instead so that occurrence word
 * indices always resolve correctly, and the verse is flagged `m: 1` and
 * recorded in `mismatches` for review.
 */
export function buildSurahs(
  words: readonly RawWord[],
  chapters: readonly QuranJsonChapter[],
): BuildSurahsResult {
  const wordsByVerse = new Map<string, string[]>();
  for (const word of words) {
    const key = `${word.s}:${word.a}`;
    let list = wordsByVerse.get(key);
    if (!list) {
      list = [];
      wordsByVerse.set(key, list);
    }
    list[word.w - 1] = word.text;
  }

  const surahFiles = new Map<number, SurahFile>();
  const surahsMeta: MetaFile["surahs"] = [];
  const mismatches: ManifestMismatch[] = [];

  for (const chapter of chapters) {
    const n = chapter.id;
    const verses: SurahVerse[] = [];

    for (const quranVerse of chapter.verses) {
      const a = quranVerse.id;
      const morphWords = wordsByVerse.get(`${n}:${a}`) ?? [];
      const quranTokens = quranVerse.text.trim().split(/\s+/).filter(Boolean);

      let tokens: string[];
      let mismatch = false;
      if (morphWords.length === quranTokens.length && morphWords.every((w) => w !== undefined)) {
        tokens = quranTokens;
      } else {
        tokens = morphWords;
        mismatch = true;
        mismatches.push({ s: n, a, morphN: morphWords.length, jsonN: quranTokens.length });
      }

      verses.push({
        a,
        w: tokens,
        t: quranVerse.translation,
        ...(mismatch ? { m: 1 as const } : {}),
      });
    }

    surahFiles.set(n, { n, verses });
    surahsMeta.push({
      n,
      nameAr: chapter.name,
      nameEn: chapter.translation,
      translit: chapter.transliteration,
      type: chapter.type === "medinan" ? "medinan" : "meccan",
      ayahs: chapter.total_verses,
    });
  }

  surahsMeta.sort((a, b) => a.n - b.n);

  return { surahFiles, meta: { surahs: surahsMeta }, mismatches };
}
