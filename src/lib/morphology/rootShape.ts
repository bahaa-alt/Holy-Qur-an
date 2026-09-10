/**
 * Classifies a root by its morphological "shape" -- which radical (if any)
 * is a weak letter (و/ي), doubled, or a hamza carrier. This corpus already
 * consolidates weak-root spelling variants under one canonical root entry
 * (e.g. every occurrence of the hollow root قول is tagged ROOT:قول, never
 * split across surface spellings), so this isn't a data-cleanup pass -- it's
 * a second, structural way to browse the same 1,651 roots: by grammatical
 * pattern rather than by first letter or meaning, useful for anyone
 * studying a weak-root conjugation pattern rather than one root's meaning.
 */
export type RootShape = "sound" | "hollow" | "defective" | "assimilated" | "geminate" | "hamzated" | "quadriliteral";

export const ROOT_SHAPE_LABELS: Record<RootShape, string> = {
  sound: "Sound (strong)",
  hollow: "Hollow (middle radical weak)",
  defective: "Defective (final radical weak)",
  assimilated: "Assimilated (initial radical weak)",
  geminate: "Geminate (doubled radical)",
  hamzated: "Hamzated (carries a hamza)",
  quadriliteral: "Quadriliteral",
};

/** Display order: from least to most morphologically irregular. */
export const ROOT_SHAPE_ORDER: RootShape[] = [
  "sound",
  "hollow",
  "defective",
  "assimilated",
  "geminate",
  "hamzated",
  "quadriliteral",
];

const WEAK_LETTERS = new Set(["و", "ي"]);
const HAMZA_CARRIERS = new Set(["ء", "أ", "إ", "ؤ", "ئ", "آ"]);

/**
 * Classifies a root string (as written in the corpus, e.g. with أ not bare
 * ء) by shape. Checks a fixed-precedence chain: quadriliteral length first,
 * then geminate (2nd = 3rd radical), then weak-letter position (hollow >
 * defective > assimilated), then hamza-anywhere, else sound.
 */
export function classifyRootShape(root: string): RootShape {
  const letters = [...root];
  if (letters.length === 4) return "quadriliteral";
  if (letters.length !== 3) return "sound"; // defensive; every corpus root is 3 or 4 letters

  const [r1, r2, r3] = letters;
  if (r2 === r3) return "geminate";
  if (WEAK_LETTERS.has(r2)) return "hollow";
  if (WEAK_LETTERS.has(r3)) return "defective";
  if (WEAK_LETTERS.has(r1)) return "assimilated";
  if (letters.some((l) => HAMZA_CARRIERS.has(l))) return "hamzated";
  return "sound";
}
