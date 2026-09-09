import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { IndexFile, ManifestFile, MetaFile, RootFile, SurahFile } from "./types";

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

export function readRootFile(root: string): RootFile {
  return readDataFile<RootFile>(`roots/${root}.json`);
}

export function readLemmaFile(key: string): RootFile {
  return readDataFile<RootFile>(`lemmas/${key}.json`);
}

export function readSurahFile(n: number): SurahFile {
  return readDataFile<SurahFile>(`surahs/${n}.json`);
}
