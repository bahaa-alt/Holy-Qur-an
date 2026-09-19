import type { ReadingsMetaFile, ReadingSurahFile, RiwayaMeta } from "../../src/lib/data/types";

/** One fetched edition, in fawazahmed0/quran-api's `{quran: [{chapter, verse, text}]}` shape. */
export interface RawEdition {
  quran: { chapter: number; verse: number; text: string }[];
}

/**
 * The seven non-Hafs transmissions this project ships, in the classical
 * order of their qari (reader). Each `slug` is both the edition's name at
 * the source and the directory it is emitted under.
 *
 * Hafs is deliberately absent: it is the app's base text, already in
 * surahs/*.json, and adding it here would both duplicate ~1.6 MB and
 * quietly imply it is one option among eight rather than the reading every
 * count in this app is computed from.
 */
export const RIWAYAT: readonly RiwayaMeta[] = [
  {
    slug: "qaloon",
    riwaya: "Qalun",
    riwayaAr: "قالون",
    qari: "Nafi' al-Madani",
    qariAr: "نافع المدني",
  },
  {
    slug: "warsh",
    riwaya: "Warsh",
    riwayaAr: "ورش",
    qari: "Nafi' al-Madani",
    qariAr: "نافع المدني",
  },
  {
    slug: "bazzi",
    riwaya: "al-Bazzi",
    riwayaAr: "البزي",
    qari: "Ibn Kathir al-Makki",
    qariAr: "ابن كثير المكي",
  },
  {
    slug: "qumbul",
    riwaya: "Qunbul",
    riwayaAr: "قنبل",
    qari: "Ibn Kathir al-Makki",
    qariAr: "ابن كثير المكي",
  },
  {
    slug: "doori",
    riwaya: "al-Duri",
    riwayaAr: "الدوري",
    qari: "Abu 'Amr al-Basri",
    qariAr: "أبو عمرو البصري",
  },
  {
    slug: "soosi",
    riwaya: "al-Susi",
    riwayaAr: "السوسي",
    qari: "Abu 'Amr al-Basri",
    qariAr: "أبو عمرو البصري",
  },
  {
    slug: "shouba",
    riwaya: "Shu'ba",
    riwayaAr: "شعبة",
    qari: "'Asim al-Kufi",
    qariAr: "عاصم الكوفي",
  },
];

/**
 * Shards each edition into one file per surah, keyed by ayah.
 *
 * Sharded rather than one file per riwaya because the UI only ever needs
 * the verses on screen: a reader comparing 2:255 should fetch al-Baqara's
 * ~40 KB, not the whole 1.6 MB transmission.
 *
 * Throws if an edition's verse count or per-surah shape disagrees with the
 * base corpus. These editions are re-segmented onto Hafs/Kufan verse
 * boundaries at the source, so they SHOULD align exactly; if a future
 * refetch stops aligning, the join is no longer meaningful and the build
 * must fail rather than silently pair up mismatched verses.
 */
export function buildReadings(
  editions: ReadonlyMap<string, RawEdition>,
  versesPerSurah: ReadonlyMap<number, number[]>,
): { meta: ReadingsMetaFile; files: Map<string, ReadingSurahFile> } {
  const files = new Map<string, ReadingSurahFile>();

  for (const riwaya of RIWAYAT) {
    const edition = editions.get(riwaya.slug);
    if (!edition) throw new Error(`buildReadings: no edition fetched for "${riwaya.slug}"`);

    const bySurah = new Map<number, Map<number, string>>();
    for (const row of edition.quran) {
      let surah = bySurah.get(row.chapter);
      if (!surah) {
        surah = new Map();
        bySurah.set(row.chapter, surah);
      }
      surah.set(row.verse, row.text);
    }

    for (const [n, ayahs] of versesPerSurah) {
      const surah = bySurah.get(n);
      if (!surah) throw new Error(`buildReadings: "${riwaya.slug}" has no surah ${n}`);
      if (surah.size !== ayahs.length) {
        throw new Error(
          `buildReadings: "${riwaya.slug}" surah ${n} has ${surah.size} verses, base corpus has ${ayahs.length}`,
        );
      }

      const verses = ayahs.map((a) => {
        const text = surah.get(a);
        if (text === undefined) {
          throw new Error(`buildReadings: "${riwaya.slug}" is missing ${n}:${a}`);
        }
        return { a, t: text };
      });
      files.set(`${riwaya.slug}/${n}`, { slug: riwaya.slug, n, verses });
    }
  }

  return { meta: { riwayat: [...RIWAYAT] }, files };
}
