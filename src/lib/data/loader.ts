import type {
  AbjadTotalsFile,
  ArIndexFile,
  CollocationsFile,
  DistinctiveVocabFile,
  EnIndexFile,
  IndexFile,
  InsightsFile,
  ManifestFile,
  MetaFile,
  OccurrenceIndexFile,
  RhymeFile,
  RootFile,
  SurahFile,
  SurahVerse,
  VerseRootsFile,
} from "./types";

// Matches next.config.ts's basePath: empty for the default (root-domain)
// build, "/<repo-name>" for the GitHub Pages project-site build.
const DATA_BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/v1`;

const cache = new Map<string, Promise<unknown>>();

/**
 * Fetches and JSON-parses `url`, caching the in-flight/resolved promise so
 * concurrent and repeated calls for the same URL never issue duplicate
 * network requests. A failed fetch is evicted from the cache so a later
 * retry (e.g. after the user reconnects) can try again.
 */
function cachedFetch<T>(url: string): Promise<T> {
  const existing = cache.get(url);
  if (existing) return existing as Promise<T>;

  const promise = fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  });

  promise.catch(() => cache.delete(url));
  cache.set(url, promise);
  return promise;
}

export function getManifest(): Promise<ManifestFile> {
  return cachedFetch(`${DATA_BASE}/manifest.json`);
}

export function getMeta(): Promise<MetaFile> {
  return cachedFetch(`${DATA_BASE}/meta.json`);
}

export function getIndex(): Promise<IndexFile> {
  return cachedFetch(`${DATA_BASE}/index.json`);
}

export function getForms(): Promise<import("./types").FormsEntry[]> {
  return cachedFetch(`${DATA_BASE}/forms.json`);
}

export function getEnIndex(): Promise<EnIndexFile> {
  return cachedFetch(`${DATA_BASE}/en-index.json`);
}

export function getVerseRoots(): Promise<VerseRootsFile> {
  return cachedFetch(`${DATA_BASE}/verse-roots.json`);
}

/**
 * Fetched lazily (not part of `prefetchAll`'s eager-shell set) -- only
 * needed once a user actually types a multi-word Arabic phrase query, so
 * most sessions never pay for it.
 */
export function getArIndex(): Promise<ArIndexFile> {
  return cachedFetch(`${DATA_BASE}/ar-index.json`);
}

/**
 * Fetched lazily, same reasoning as getArIndex -- only needed by the
 * cross-corpus advanced search page, not the common browsing paths.
 */
export function getOccurrenceIndex(): Promise<OccurrenceIndexFile> {
  return cachedFetch(`${DATA_BASE}/occurrences.json`);
}

export function getInsights(): Promise<InsightsFile> {
  return cachedFetch(`${DATA_BASE}/insights.json`);
}

export function getRhyme(): Promise<RhymeFile> {
  return cachedFetch(`${DATA_BASE}/rhyme.json`);
}

export function getDistinctiveVocab(): Promise<DistinctiveVocabFile> {
  return cachedFetch(`${DATA_BASE}/distinctive-vocab.json`);
}

export function getCollocations(): Promise<CollocationsFile> {
  return cachedFetch(`${DATA_BASE}/collocations.json`);
}

export function getAbjad(): Promise<AbjadTotalsFile> {
  return cachedFetch(`${DATA_BASE}/abjad.json`);
}

export function getRoot(root: string): Promise<RootFile> {
  return cachedFetch(`${DATA_BASE}/roots/${encodeURIComponent(root)}.json`);
}

export function getLemma(key: string): Promise<RootFile> {
  return cachedFetch(`${DATA_BASE}/lemmas/${encodeURIComponent(key)}.json`);
}

export function getSurah(n: number): Promise<SurahFile> {
  return cachedFetch(`${DATA_BASE}/surahs/${n}.json`);
}

/**
 * Resolves a list of (surah, ayah) references to their verses, fetching
 * each distinct surah file at most once regardless of how many refs point
 * into it. Returns a map keyed by "surah:ayah".
 */
export async function getVerses(
  refs: readonly { s: number; a: number }[],
): Promise<Map<string, SurahVerse>> {
  const surahNums = [...new Set(refs.map((r) => r.s))];
  const surahs = await Promise.all(surahNums.map((n) => getSurah(n)));
  const surahByNum = new Map(surahs.map((s) => [s.n, s]));

  const result = new Map<string, SurahVerse>();
  for (const ref of refs) {
    const surah = surahByNum.get(ref.s);
    const verse = surah?.verses.find((v) => v.a === ref.a);
    if (verse) result.set(`${ref.s}:${ref.a}`, verse);
  }
  return result;
}

export interface PrefetchProgress {
  loaded: number;
  total: number;
}

/**
 * Warms the cache (and, transitively, the service worker's Cache Storage,
 * since these are ordinary `fetch` calls the SW intercepts) with every
 * surah and root file, so the app keeps working fully offline. Runs in
 * small concurrent batches to avoid saturating the connection.
 */
export async function prefetchAll(
  roots: readonly string[],
  onProgress?: (p: PrefetchProgress) => void,
): Promise<void> {
  const surahNums = Array.from({ length: 114 }, (_, i) => i + 1);
  const tasks: (() => Promise<unknown>)[] = [
    ...surahNums.map((n) => () => getSurah(n)),
    ...roots.map((r) => () => getRoot(r)),
  ];

  const total = tasks.length;
  let loaded = 0;
  const BATCH_SIZE = 20;

  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((task) =>
        task()
          .catch(() => undefined)
          .finally(() => {
            loaded++;
            onProgress?.({ loaded, total });
          }),
      ),
    );
  }
}
