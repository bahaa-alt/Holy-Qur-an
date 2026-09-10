/**
 * The conventional chronological (revelation) order of the 114 surahs, as
 * commonly reproduced (e.g. the order used in the 1924 Cairo/Al-Azhar
 * edition and widely mirrored since). This is one long-standing scholarly
 * convention, not an uncontested academic consensus -- other orderings
 * (e.g. Nöldeke's) differ in places -- but it's the one most commonly cited
 * alongside the Qur'an's standard (Uthmani) surah numbering used everywhere
 * else in this app.
 *
 * CHRONOLOGICAL_ORDER_BY_SURAH[n - 1] = this surah's position (1-114) in
 * revelation order. Positions 1-86 are Meccan, 87-114 are Medinan --
 * consistent with the standard 86/28 Meccan/Medinan split.
 */
const REVELATION_ORDER: number[] = [
  96, 68, 73, 74, 1, 111, 81, 87, 92, 89, 93, 94, 103, 100, 108, 102, 107, 109, 105, 113, 114, 112, 53, 80, 97, 91, 85,
  95, 106, 101, 75, 104, 77, 50, 90, 86, 54, 38, 7, 72, 36, 25, 35, 19, 20, 56, 26, 27, 28, 17, 10, 11, 12, 15, 6, 37,
  31, 34, 39, 40, 41, 42, 43, 44, 45, 46, 51, 88, 18, 16, 71, 14, 21, 23, 32, 52, 67, 69, 70, 78, 79, 82, 84, 30, 29,
  83, 2, 8, 3, 33, 60, 4, 99, 57, 47, 13, 55, 76, 65, 98, 59, 24, 22, 63, 58, 49, 66, 64, 61, 62, 48, 5, 9, 110,
];

export const CHRONOLOGICAL_ORDER_BY_SURAH: readonly number[] = (() => {
  const bySurah = new Array<number>(114);
  REVELATION_ORDER.forEach((surah, i) => {
    bySurah[surah - 1] = i + 1;
  });
  return bySurah;
})();
