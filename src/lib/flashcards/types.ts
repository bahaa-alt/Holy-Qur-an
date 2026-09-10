/** "root:{root}" for a root card, "lemma:{key}" for a lemma card (mirrors SavedItem.id's convention). */
export type CardId = string;

export type DeckKind = "roots" | "lemmas";

export interface CardDef {
  id: CardId;
  kind: DeckKind;
  /** Arabic text shown on the card front */
  ar: string;
  /** the root whose RootFile to fetch (getRoot) on flip -- every card, root or lemma, resolves through a root file */
  root: string;
  /** for a lemma card, the specific lemma key within that root's file; undefined for a root card */
  lemmaKey?: string;
}

export interface CardProgress {
  id: CardId;
  /** current spaced-repetition interval, in days */
  intervalDays: number;
  /** SM-2 ease factor */
  ease: number;
  /** ISO timestamp of when this card is next due */
  dueAt: string;
  /** total number of times graded */
  reps: number;
  /** number of times graded "again" after having matured past day 0 */
  lapses: number;
}

export type Grade = "again" | "hard" | "good" | "easy";
