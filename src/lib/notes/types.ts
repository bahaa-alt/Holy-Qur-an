export type SavedKind = "root" | "word" | "verse";

export interface SavedItem {
  /** stable id, e.g. "root:كتب", "word:كِتاب", "verse:2:255" */
  id: string;
  kind: SavedKind;
  label: string;
  href: string;
  note: string;
  savedAt: string;
}
