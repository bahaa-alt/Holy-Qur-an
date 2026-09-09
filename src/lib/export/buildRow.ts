import { describeTags } from "@/lib/morphology/tagLabels";
import type { OccRow } from "@/lib/root/occurrences";
import type { OccurrenceRow, SurahMeta, SurahVerse } from "@/lib/data/types";

/** Combines an occurrence row with its resolved verse and surah metadata for export/display. */
export function buildExportRow(
  row: OccRow,
  root: string | null,
  verse: SurahVerse,
  surahMeta: SurahMeta,
): OccurrenceRow {
  return {
    surah: row.s,
    ayah: row.a,
    surahNameAr: surahMeta.nameAr,
    surahNameEn: surahMeta.translit,
    wordIndex: row.w,
    form: row.form,
    lemma: row.lemma,
    root,
    category: row.cat,
    tags: describeTags(row.tagsJoined)
      .map((t) => t.en)
      .join("; "),
    verseUthmani: verse.w.join(" "),
    translation: verse.t,
  };
}
