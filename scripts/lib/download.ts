import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** The pipeline's download cache. Exported so other fetchers share one location. */
export const RAW_DIR = join(process.cwd(), "data", "raw");

function cachePathFor(cacheKey: string): string {
  return join(RAW_DIR, cacheKey);
}

/**
 * How a transient failure is retried.
 *
 * WHY THIS EXISTS. The pipeline pulls its corpus from five third-party
 * repositories at build time. A single dropped TLS connection to any one
 * of them used to fail the whole build: CI went red on a commit whose own
 * PR had passed minutes earlier, and whose deploy (the same fetches again)
 * succeeded minutes later. That is a network event being reported as a
 * broken commit, which wastes a cycle and teaches everyone to ignore red.
 *
 * `fetchImpl` and `sleep` are injectable so the retry logic can be tested
 * without a network or a real wait.
 */
export interface RetryOptions {
  /** total tries, not retries: 1 means no retry. Default 4. */
  attempts?: number;
  /** first backoff; doubles each time. Default 1000ms, so 1s / 2s / 4s. */
  baseDelayMs?: number;
  /** what to call the resource in an error message, e.g. "Lane's Lexicon" */
  label?: string;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  /** called before each wait; defaults to a console warning */
  onRetry?: (info: {
    url: string;
    attempt: number;
    attempts: number;
    delayMs: number;
    reason: string;
  }) => void;
}

/**
 * Whether an HTTP status is worth trying again.
 *
 * 5xx, 429 (rate limited) and 408/425 are the server saying "not now".
 * Everything else -- 404 above all -- is the server saying "not ever":
 * retrying a wrong URL three times only delays a clear error by seven
 * seconds, so those fail immediately.
 */
export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Thrown when a fetch fails permanently, or keeps failing transiently. */
export class DownloadError extends Error {}

/**
 * Fetches a URL, retrying transient failures with exponential backoff.
 *
 * The body is read INSIDE the retry, not after it: an ECONNRESET usually
 * lands mid-body, after the response headers have already arrived, so a
 * retry that wrapped only `fetch()` would not have caught the failure that
 * prompted this.
 *
 * Deliberately no jitter: one runner fetching five files is not a
 * thundering herd, and fixed delays are easier to reason about and to test.
 */
async function fetchWithRetry<T>(
  url: string,
  read: (res: Response) => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const attempts = opts.attempts ?? 4;
  const baseDelayMs = opts.baseDelayMs ?? 1000;
  const doFetch = opts.fetchImpl ?? fetch;
  const sleep = opts.sleep ?? defaultSleep;
  const what = opts.label ? `${opts.label} (${url})` : url;
  const onRetry =
    opts.onRetry ??
    ((info) =>
      console.warn(
        `  retrying ${what} in ${info.delayMs}ms (attempt ${info.attempt}/${info.attempts} failed: ${info.reason})`,
      ));

  let lastReason = "unknown";
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await doFetch(url);
      if (res.ok) return await read(res);
      lastReason = `${res.status} ${res.statusText}`;
      if (!isRetryableStatus(res.status)) {
        throw new DownloadError(`Failed to fetch ${what}: ${lastReason}`);
      }
    } catch (e) {
      if (e instanceof DownloadError) throw e;
      // A thrown fetch is a network-layer failure (DNS, TLS, reset,
      // socket hang-up). Those are exactly the retryable ones.
      lastReason = e instanceof Error ? e.message : String(e);
      if (e instanceof Error && e.cause instanceof Error) {
        lastReason = `${lastReason} (${e.cause.message})`;
      }
    }

    if (attempt < attempts) {
      const delayMs = baseDelayMs * 2 ** (attempt - 1);
      onRetry({ url, attempt, attempts, delayMs, reason: lastReason });
      await sleep(delayMs);
    }
  }

  throw new DownloadError(
    `Failed to fetch ${what} after ${attempts} attempts; last failure: ${lastReason}`,
  );
}

/** Fetches a URL as text, retrying transient failures. See fetchWithRetry. */
export function fetchTextWithRetry(url: string, opts: RetryOptions = {}): Promise<string> {
  return fetchWithRetry(url, (res) => res.text(), opts);
}

/** Fetches a URL as bytes, retrying transient failures. See fetchWithRetry. */
export function fetchBufferWithRetry(url: string, opts: RetryOptions = {}): Promise<Buffer> {
  return fetchWithRetry(url, async (res) => Buffer.from(await res.arrayBuffer()), opts);
}

/**
 * Fetches `url` as text, caching the result under data/raw/<cacheKey>.
 * Subsequent calls (including future builds) reuse the cached file unless
 * `force` is set. Returns the text content plus its sha256 for the manifest.
 */
export async function fetchCached(
  url: string,
  cacheKey: string,
  opts: { force?: boolean; retry?: RetryOptions } = {},
): Promise<{ text: string; sha256: string; fromCache: boolean }> {
  const path = cachePathFor(cacheKey);

  if (!opts.force && existsSync(path)) {
    const text = readFileSync(path, "utf8");
    return { text, sha256: sha256Of(text), fromCache: true };
  }

  const text = await fetchTextWithRetry(url, opts.retry ?? {});

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");

  return { text, sha256: sha256Of(text), fromCache: false };
}

export async function fetchCachedJSON<T>(
  url: string,
  cacheKey: string,
  opts: { force?: boolean; retry?: RetryOptions } = {},
): Promise<{ data: T; sha256: string; fromCache: boolean }> {
  const { text, sha256, fromCache } = await fetchCached(url, cacheKey, opts);
  return { data: JSON.parse(text) as T, sha256, fromCache };
}

function sha256Of(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
}
