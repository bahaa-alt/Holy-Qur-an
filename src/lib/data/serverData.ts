import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  AbjadTotalsFile,
  DistinctiveVocabFile,
  FormulasFile,
  IndexFile,
  InsightsFile,
  ManifestFile,
  MetaFile,
  RhymeFile,
  RootFile,
  SurahFile,
  VerseRootsFile,
} from "./types";

/**
 * Reads a static data file directly from disk. Only valid at build time
 * (server components / generateStaticParams under `output: 'export'` --
 * there is no server at runtime), which is exactly when this is used: it
 * lets root/word/surah pages render their static content (headers,
 * summaries, generateStaticParams lists) without a client-side fetch.
 */
function readDataFile<T>(relativePath: string): T {
  const fullPath = join(process.cwd(), "public", "data", "v1", relativePath);
  return JSON.parse(readFileSync(fullPath, "utf8")) as T;
}

export function readIndex(): IndexFile {
  return readDataFile<IndexFile>("index.json");
}

export function readMeta(): MetaFile {
  return readDataFile<MetaFile>("meta.json");
}

export function readManifest(): ManifestFile {
  return readDataFile<ManifestFile>("manifest.json");
}

export function readInsights(): InsightsFile {
  return readDataFile<InsightsFile>("insights.json");
}

export function readFormulas(): FormulasFile {
  return readDataFile<FormulasFile>("formulas.json");
}

export function readDistinctiveVocab(): DistinctiveVocabFile {
  return readDataFile<DistinctiveVocabFile>("distinctive-vocab.json");
}

export function readRhyme(): RhymeFile {
  return readDataFile<RhymeFile>("rhyme.json");
}

export function readAbjad(): AbjadTotalsFile {
  return readDataFile<AbjadTotalsFile>("abjad.json");
}

export function readRootFile(root: string): RootFile {
  return readDataFile<RootFile>(`roots/${root}.json`);
}

export function readLemmaFile(key: string): RootFile {
  return readDataFile<RootFile>(`lemmas/${key}.json`);
}

export function readSurahFile(n: number): SurahFile {
  return readDataFile<SurahFile>(`surahs/${n}.json`);
}

// Unlike the other readers above, verse-roots.json is large (~every rooted
// word in the corpus) and identical across every call within one build
// process -- static export calls readVerseRoots() once per root page
// (1,651+ times), so a plain readFileSync per call would reread the same
// ~600KB file that often. Memoized per-worker-process instead.
let verseRootsCache: VerseRootsFile | null = null;

export function readVerseRoots(): VerseRootsFile {
  if (!verseRootsCache) {
    verseRootsCache = readDataFile<VerseRootsFile>("verse-roots.json");
  }
  return verseRootsCache;
}
