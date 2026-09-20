/**
 * What can be saved.
 *
 * Originally roots, words and verses -- the things this app had pages
 * for. A researcher's unit of work is not only a page, though: a query
 * they refined, a grammar filter, a keyness scope. Those are views, and
 * they are exactly what someone needs to come back to, so they are
 * saveable too. Every kind resolves to a URL that restores the state.
 */
export type SavedKind = "root" | "word" | "verse" | "query" | "view";

export interface SavedItem {
  /** stable id, e.g. "root:كتب", "verse:2:255", "query:[root=علم]" */
  id: string;
  kind: SavedKind;
  label: string;
  href: string;
  /** a second line: the result count, the scope, the facet -- optional */
  detail?: string;
  note: string;
  savedAt: string;
}
