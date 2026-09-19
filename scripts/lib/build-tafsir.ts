import type { TafsirMetaFile, TafsirSurahFile } from "../../src/lib/data/types";

/** One row as committed under references/tafsir/<slug>/<n>.json. */
export interface RawTafsirRow {
  surah: number;
  ayah: number;
  text: string;
}

export const TAFSIR_SLUG = "jalalayn";

/**
 * Shards a committed tafsir into one file per surah, keyed by ayah.
 *
 * COVERAGE IS PARTIAL AND THAT IS NOT AN ERROR. Tafsir al-Jalalayn carries
 * an entry for 6,010 of the corpus's 6,236 verses. The 226 gaps are
 * interior and scattered across 56 surahs, never trailing runs -- they are
 * verses the commentary treats as needing no separate note. Surah 55 alone
 * accounts for 32 of them: they are the repeated refrain (فبأي آلاء ربكما
 * تكذبان), glossed once rather than thirty-one times.
 *
 * So a verse with no entry must render as *no entry*. Carrying the nearest
 * preceding note forward would attribute to al-Jalalayn a comment on a
 * verse he did not separately comment on, which is precisely the kind of
 * fabricated attribution this app exists not to make.
 *
 * Verse numbers are validated against the base corpus: an entry pointing at
 * a verse that does not exist, or at the wrong surah, fails the build
 * rather than being dropped, because either means the source no longer
 * aligns with the text this app ships.
 */
export function buildTafsir(
  bySurah: ReadonlyMap<number, readonly RawTafsirRow[]>,
  versesPerSurah: ReadonlyMap<number, number[]>,
): { meta: TafsirMetaFile; files: Map<number, TafsirSurahFile> } {
  const files = new Map<number, TafsirSurahFile>();
  let covered = 0;
  let total = 0;

  for (const [n, ayahs] of versesPerSurah) {
    total += ayahs.length;
    const rows = bySurah.get(n);
    if (!rows) throw new Error(`buildTafsir: no tafsir file for surah ${n}`);

    const valid = new Set(ayahs);
    const seen = new Set<number>();
    const entries: { a: number; t: string }[] = [];

    for (const row of rows) {
      if (row.surah !== n) {
        throw new Error(`buildTafsir: surah ${n}'s file contains a row for surah ${row.surah}`);
      }
      if (!valid.has(row.ayah)) {
        throw new Error(
          `buildTafsir: ${n}:${row.ayah} is not a verse of surah ${n} in this corpus`,
        );
      }
      if (seen.has(row.ayah)) {
        throw new Error(`buildTafsir: duplicate entry for ${n}:${row.ayah}`);
      }
      seen.add(row.ayah);

      const text = row.text.trim();
      if (text === "") continue;
      entries.push({ a: row.ayah, t: text });
    }

    entries.sort((x, y) => x.a - y.a);
    covered += entries.length;
    files.set(n, { slug: TAFSIR_SLUG, n, entries });
  }

  return {
    meta: {
      slug: TAFSIR_SLUG,
      name: "Tafsir al-Jalalayn",
      nameAr: "تفسير الجلالين",
      authors: "Jalal al-Din al-Mahalli (d. 864/1459) and Jalal al-Din al-Suyuti (d. 911/1505)",
      authorsAr: "جلال الدين المحلي وجلال الدين السيوطي",
      coveredVerses: covered,
      totalVerses: total,
    },
    files,
  };
}
