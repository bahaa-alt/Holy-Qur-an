import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const RAW_DIR = join(process.cwd(), "data", "raw");

function cachePathFor(cacheKey: string): string {
  return join(RAW_DIR, cacheKey);
}

/**
 * Fetches `url` as text, caching the result under data/raw/<cacheKey>.
 * Subsequent calls (including future builds) reuse the cached file unless
 * `force` is set. Returns the text content plus its sha256 for the manifest.
 */
export async function fetchCached(
  url: string,
  cacheKey: string,
  opts: { force?: boolean } = {},
): Promise<{ text: string; sha256: string; fromCache: boolean }> {
  const path = cachePathFor(cacheKey);

  if (!opts.force && existsSync(path)) {
    const text = readFileSync(path, "utf8");
    return { text, sha256: sha256Of(text), fromCache: true };
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");

  return { text, sha256: sha256Of(text), fromCache: false };
}

export async function fetchCachedJSON<T>(
  url: string,
  cacheKey: string,
  opts: { force?: boolean } = {},
): Promise<{ data: T; sha256: string; fromCache: boolean }> {
  const { text, sha256, fromCache } = await fetchCached(url, cacheKey, opts);
  return { data: JSON.parse(text) as T, sha256, fromCache };
}

function sha256Of(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
}
