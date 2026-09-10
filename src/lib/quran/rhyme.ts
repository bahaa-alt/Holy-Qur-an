import type { RhymeRow } from "@/lib/data/types";

/**
 * Shaped like LetterCount (see src/lib/arabic/letterFrequency.ts) --
 * `letter`, not `ending` -- so the ranked list can be rendered directly by
 * LetterFrequencyTable without a remapping step.
 */
export interface RhymeEndingCount {
  letter: string;
  count: number;
}

/** Ranks every distinct verse-ending letter by how many verses end with it. */
export function countRhymeEndings(rows: readonly RhymeRow[]): RhymeEndingCount[] {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.ending, (counts.get(r.ending) ?? 0) + 1);

  return [...counts.entries()]
    .map(([letter, count]) => ({ letter, count }))
    .sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter));
}

/** Every verse ending in a specific letter, in Qur'an order. */
export function versesWithEnding(rows: readonly RhymeRow[], ending: string): RhymeRow[] {
  return rows.filter((r) => r.ending === ending);
}
