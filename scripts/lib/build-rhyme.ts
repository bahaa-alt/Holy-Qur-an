import { stripDiacritics } from "../../src/lib/arabic/normalize";
import type { RhymeFile, RhymeRow, SurahFile } from "../../src/lib/data/types";

/**
 * Every verse's ending letter (see RhymeRow's doc comment), in Qur'an
 * order. Computed directly from the already-built surah files -- no new
 * downloads, just the last word of each verse.
 */
export function buildRhyme(surahFiles: ReadonlyMap<number, SurahFile>): RhymeFile {
  const rows: RhymeRow[] = [];

  const surahNums = [...surahFiles.keys()].sort((a, b) => a - b);
  for (const n of surahNums) {
    const file = surahFiles.get(n)!;
    for (const verse of file.verses) {
      const lastWord = verse.w[verse.w.length - 1] ?? "";
      const stripped = stripDiacritics(lastWord);
      const ending = stripped.length > 0 ? stripped[stripped.length - 1] : "";
      rows.push({ s: n, a: verse.a, ending });
    }
  }

  return { rows };
}
