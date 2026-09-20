import { getVerses } from "@/lib/data/loader";
import type { ExportTable } from "./table";
import type { QcqlMatch } from "@/lib/qcql/types";
import type { SurahMeta } from "@/lib/data/types";

/**
 * Turns word-position matches into an export table.
 *
 * Shared by /query/ and the grammar browser on /syntax/ because both
 * produce the same thing -- a list of (surah, ayah, word) positions -- and
 * a researcher comparing two exports should not have to reconcile two
 * column layouts for the same kind of result.
 *
 * The verse text is fetched here rather than carried in: the pages only
 * load the surahs they are currently displaying, and an export covers
 * every match, not the visible page.
 */
export async function buildMatchesTable(
  matches: readonly QcqlMatch[],
  surahs: readonly SurahMeta[],
  meta: { slug: string; title: string; provenance?: { label: string; value: string }[] },
): Promise<ExportTable> {
  const verses = await getVerses(matches.map((m) => ({ s: m.s, a: m.a })));
  const surahByNum = new Map(surahs.map((s) => [s.n, s]));

  const rows = matches.map((m) => {
    const verse = verses.get(`${m.s}:${m.a}`);
    const surah = surahByNum.get(m.s);
    // Word indices are 1-based throughout this app, including in the
    // indices these matches come from.
    const word = verse?.w[m.w - 1] ?? "";
    return [
      m.s,
      m.a,
      m.w,
      surah?.translit ?? "",
      surah?.nameAr ?? "",
      word,
      verse?.w.join(" ") ?? "",
      verse?.t ?? "",
    ];
  });

  return {
    slug: meta.slug,
    meta: { title: meta.title, provenance: meta.provenance },
    columns: [
      { key: "surah", label: "surah" },
      { key: "ayah", label: "ayah" },
      { key: "word_index", label: "word_index" },
      { key: "surah_name", label: "surah_name" },
      { key: "surah_name_ar", label: "surah_name_ar" },
      { key: "word", label: "word" },
      { key: "verse_uthmani", label: "verse_uthmani" },
      { key: "translation", label: "translation" },
    ],
    rows,
  };
}
