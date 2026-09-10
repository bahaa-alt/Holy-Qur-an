import { stripDiacritics } from "./normalize";

/**
 * The classical Abjad numeral values (حساب الجُمَّل), the ancient system
 * assigning each of the 28 Arabic letters a fixed numeric value --
 * ا ب ج د ه و ز ح ط ي (1-10), ك ل م ن س ع ف ص (20-90 by tens), ق ر ش ت ث
 * خ ذ ض ظ غ (100-1000 by hundreds). Used historically for chronograms,
 * numerology (ʿilm al-ḥurūf), and letter-value computation of Qur'anic
 * text -- the same order and values taught in every standard reference on
 * the subject.
 */
export const ABJAD_VALUES: Readonly<Record<string, number>> = {
  ا: 1,
  ب: 2,
  ج: 3,
  د: 4,
  ه: 5,
  و: 6,
  ز: 7,
  ح: 8,
  ط: 9,
  ي: 10,
  ك: 20,
  ل: 30,
  م: 40,
  ن: 50,
  س: 60,
  ع: 70,
  ف: 80,
  ص: 90,
  ق: 100,
  ر: 200,
  ش: 300,
  ت: 400,
  ث: 500,
  خ: 600,
  ذ: 700,
  ض: 800,
  ظ: 900,
  غ: 1000,
};

/**
 * Letter variants folded to the base letter whose value they take in
 * classical Abjad reckoning -- alif forms and hamza carriers (which have
 * no separate value in the 28-letter system, predating hamza as a
 * distinct letter) all count as ا; alif maksura as ي; teh marbuta as ه.
 * Same unifications {@link normalize} makes for search, plus hamza.
 */
function abjadLetterKey(ch: string): string {
  if (ch === "آ" || ch === "أ" || ch === "إ" || ch === "ٱ") return "ا";
  if (ch === "ى") return "ي";
  if (ch === "ة") return "ه";
  if (ch === "ء" || ch === "ؤ" || ch === "ئ") return "ا";
  return ch;
}

/**
 * The 28 letters in their traditional Abjad mnemonic order/grouping --
 * أبجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ -- the sequence the system is
 * taught and recited in. Display-only; ABJAD_VALUES is the lookup table.
 */
export const ABJAD_LETTER_ORDER: readonly string[] = [
  "ا",
  "ب",
  "ج",
  "د",
  "ه",
  "و",
  "ز",
  "ح",
  "ط",
  "ي",
  "ك",
  "ل",
  "م",
  "ن",
  "س",
  "ع",
  "ف",
  "ص",
  "ق",
  "ر",
  "ش",
  "ت",
  "ث",
  "خ",
  "ذ",
  "ض",
  "ظ",
  "غ",
];

export interface AbjadLetter {
  /** the original letter as written (before variant-folding) */
  letter: string;
  value: number;
}

/**
 * Breaks text into its Abjad letter values, diacritics stripped, in
 * reading order. Characters with no Abjad value (spaces, Latin,
 * punctuation) are skipped rather than counted as zero.
 */
export function abjadLetterValues(text: string): AbjadLetter[] {
  const result: AbjadLetter[] = [];
  for (const ch of stripDiacritics(text)) {
    const value = ABJAD_VALUES[abjadLetterKey(ch)];
    if (value !== undefined) result.push({ letter: ch, value });
  }
  return result;
}

/** Sums the Abjad value of a piece of text (a single letter, a word, or a whole passage). */
export function abjadValueOf(text: string): number {
  let sum = 0;
  for (const { value } of abjadLetterValues(text)) sum += value;
  return sum;
}
