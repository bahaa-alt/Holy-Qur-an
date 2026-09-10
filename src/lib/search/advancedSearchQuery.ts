import type { Cat } from "@/lib/data/types";

/**
 * The full filter state of /search/advanced's UI, as plain values (not the
 * Sets AdvancedSearchView keeps in state) so it round-trips through a URL
 * query string. Kept separate from AdvancedSearchFilters (advancedSearch.ts)
 * because that type is shaped for filterOccurrences (root by index, not by
 * text) -- this one is shaped for what belongs in a shareable URL.
 */
export interface AdvancedSearchQueryState {
  cats: Cat[];
  /** 1-11 (Form I-XI) */
  verbForms: number[];
  revelation: "all" | "meccan" | "medinan";
  /** the root's Arabic text, or null when no root filter is set */
  rootAr: string | null;
  surahFrom: number;
  surahTo: number;
  page: number;
}

/** Encodes non-default filter state into a `?`-less query string, so the page is shareable/bookmarkable. */
export function encodeAdvancedSearchQuery(state: AdvancedSearchQueryState): string {
  const params = new URLSearchParams();
  if (state.cats.length > 0) params.set("cats", state.cats.join(","));
  if (state.verbForms.length > 0) params.set("forms", state.verbForms.join(","));
  if (state.revelation !== "all") params.set("rev", state.revelation);
  if (state.rootAr) params.set("root", state.rootAr);
  if (state.surahFrom !== 1) params.set("from", String(state.surahFrom));
  if (state.surahTo !== 114) params.set("to", String(state.surahTo));
  if (state.page !== 0) params.set("page", String(state.page));
  return params.toString();
}

/**
 * Decodes a `location.search` string back into filter state, defaulting
 * (and silently dropping) anything malformed or out of range rather than
 * throwing -- a hand-edited or stale URL should degrade to "no filter" on
 * that one facet, not break the page.
 */
export function decodeAdvancedSearchQuery(search: string, validCats: ReadonlySet<Cat>): AdvancedSearchQueryState {
  const params = new URLSearchParams(search);

  const cats = (params.get("cats")?.split(",") ?? []).filter((c): c is Cat => validCats.has(c as Cat));

  const verbForms = (params.get("forms")?.split(",") ?? [])
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 11);

  const rev = params.get("rev");
  const revelation: "all" | "meccan" | "medinan" = rev === "meccan" || rev === "medinan" ? rev : "all";

  const rootAr = params.get("root") || null;

  const fromRaw = Number(params.get("from"));
  const surahFrom = Number.isInteger(fromRaw) && fromRaw >= 1 && fromRaw <= 114 ? fromRaw : 1;

  const toRaw = Number(params.get("to"));
  const surahTo = Number.isInteger(toRaw) && toRaw >= 1 && toRaw <= 114 ? toRaw : 114;

  const pageRaw = Number(params.get("page"));
  const page = Number.isInteger(pageRaw) && pageRaw >= 0 ? pageRaw : 0;

  return { cats, verbForms, revelation, rootAr, surahFrom, surahTo, page };
}
