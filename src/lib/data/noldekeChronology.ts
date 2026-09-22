/**
 * Theodor Nöldeke's chronological (revelation) order of the 114 surahs, as
 * commonly reproduced in secondary literature (e.g. the comparison table in
 * Wikipedia's "List of chapters in the Quran", drawing on Nöldeke &
 * Schwally's Geschichte des Qorâns). This is a distinct scholarly proposal
 * from CHRONOLOGICAL_ORDER_BY_SURAH (chronologicalOrder.ts, the
 * 1924-Cairo-edition convention already used throughout this app) -- the
 * two orderings agree on many surahs but not all, which is the whole point
 * of carrying both: a researcher can compare where they diverge instead of
 * this app silently picking one Orientalist reconstruction as *the*
 * answer. Nöldeke divides the Meccan period into three phases (48 + 21 +
 * 21 surahs) followed by 24 Medinan surahs, 114 total.
 *
 * Cross-checked against three independently retrieved facts before
 * shipping (not just internal permutation validity): position 68 is surah
 * 27 (An-Naml), position 110 is surah 60 (Al-Mumtahanah), position 112 is
 * surah 49 (Al-Hujurat) -- all three match this table exactly.
 *
 * NOLDEKE_ORDER_BY_SURAH[n - 1] = this surah's position (1-114) in
 * Nöldeke's reconstructed revelation order.
 */
const MECCAN_PERIOD_1: readonly number[] = [
  96, 74, 111, 106, 108, 104, 107, 102, 105, 92, 90, 94, 93, 97, 86, 91, 80, 68, 87, 95, 103, 85,
  73, 101, 99, 82, 81, 53, 84, 100, 79, 77, 78, 88, 89, 75, 83, 69, 51, 52, 56, 70, 55, 112, 109,
  113, 114, 1,
];
const MECCAN_PERIOD_2: readonly number[] = [
  54, 37, 71, 76, 44, 50, 20, 26, 15, 19, 38, 36, 43, 72, 67, 23, 21, 25, 17, 27, 18,
];
const MECCAN_PERIOD_3: readonly number[] = [
  32, 41, 45, 16, 30, 11, 14, 12, 40, 28, 39, 29, 31, 42, 10, 34, 35, 7, 46, 6, 13,
];
const MEDINAN_PERIOD: readonly number[] = [
  2, 98, 64, 62, 8, 47, 3, 61, 57, 4, 65, 59, 33, 63, 24, 58, 22, 48, 66, 60, 110, 49, 9, 5,
];

const NOLDEKE_ORDER: readonly number[] = [
  ...MECCAN_PERIOD_1,
  ...MECCAN_PERIOD_2,
  ...MECCAN_PERIOD_3,
  ...MEDINAN_PERIOD,
];

export const NOLDEKE_ORDER_BY_SURAH: readonly number[] = (() => {
  const bySurah = new Array<number>(114);
  NOLDEKE_ORDER.forEach((surah, i) => {
    bySurah[surah - 1] = i + 1;
  });
  return bySurah;
})();
