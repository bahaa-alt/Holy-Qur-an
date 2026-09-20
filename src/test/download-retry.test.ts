import { describe, expect, it, vi } from "vitest";
import {
  DownloadError,
  fetchBufferWithRetry,
  fetchTextWithRetry,
  isRetryableStatus,
} from "../../scripts/lib/download";

/**
 * What this pins: a dropped connection to a third-party corpus host is a
 * network event, not a broken commit. One ECONNRESET used to fail the
 * whole build (CI red on a commit whose own PR had passed minutes
 * earlier). A 404, by contrast, must still fail at once.
 *
 * Hermetic: fetch and sleep are both injected, so nothing here touches the
 * network or waits.
 */
const ok = (body: string) => new Response(body, { status: 200 });
const status = (code: number, text = "") => new Response(text, { status: code });
const reset = () => {
  const e = new TypeError("fetch failed");
  (e as Error & { cause?: unknown }).cause = Object.assign(new Error("read ECONNRESET"), {
    code: "ECONNRESET",
  });
  return e;
};

/** Collects the delays a run would have waited, without waiting. */
function recorder() {
  const delays: number[] = [];
  return {
    delays,
    sleep: async (ms: number) => {
      delays.push(ms);
    },
    onRetry: () => {},
  };
}

describe("isRetryableStatus", () => {
  it("retries a server saying 'not now', not one saying 'not ever'", () => {
    for (const s of [500, 502, 503, 504, 429, 408, 425])
      expect(isRetryableStatus(s), `${s}`).toBe(true);
    for (const s of [400, 401, 403, 404, 410, 422, 200])
      expect(isRetryableStatus(s), `${s}`).toBe(false);
  });
});

describe("fetchTextWithRetry", () => {
  it("does not retry, or sleep, when the first try works", async () => {
    const fetchImpl = vi.fn(async () => ok("corpus"));
    const r = recorder();
    await expect(fetchTextWithRetry("https://x/data", { fetchImpl, ...r })).resolves.toBe("corpus");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(r.delays).toEqual([]);
  });

  it("recovers from the ECONNRESET that prompted this", async () => {
    const fetchImpl = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(reset())
      .mockResolvedValueOnce(ok("corpus"));
    const r = recorder();
    await expect(fetchTextWithRetry("https://x/data", { fetchImpl, ...r })).resolves.toBe("corpus");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(r.delays).toEqual([1000]);
  });

  it("backs off exponentially, then gives up naming the last failure", async () => {
    const fetchImpl = vi.fn(async () => {
      throw reset();
    });
    const r = recorder();
    await expect(fetchTextWithRetry("https://x/data", { fetchImpl, ...r })).rejects.toThrow(
      /after 4 attempts[\s\S]*ECONNRESET/,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(r.delays).toEqual([1000, 2000, 4000]);
  });

  it("retries a 503 and succeeds", async () => {
    const fetchImpl = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(status(503, "busy"))
      .mockResolvedValueOnce(ok("corpus"));
    const r = recorder();
    await expect(fetchTextWithRetry("https://x/data", { fetchImpl, ...r })).resolves.toBe("corpus");
    expect(r.delays).toEqual([1000]);
  });

  it("fails a 404 immediately rather than waiting seven seconds to say so", async () => {
    const fetchImpl = vi.fn(async () => status(404));
    const r = recorder();
    const err = await fetchTextWithRetry("https://x/gone", { fetchImpl, ...r }).catch((e) => e);
    expect(err).toBeInstanceOf(DownloadError);
    expect(err.message).toMatch(/404/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(r.delays).toEqual([]);
  });

  it("names the resource in the error when given a label", async () => {
    const fetchImpl = vi.fn(async () => status(404));
    await expect(
      fetchTextWithRetry("https://x/lane.zip", {
        fetchImpl,
        ...recorder(),
        label: "Lane's Lexicon",
      }),
    ).rejects.toThrow(/Lane's Lexicon \(https:\/\/x\/lane\.zip\)/);
  });

  it("retries a body that dies mid-read, not just a failed connection", async () => {
    // The actual shape of the CI failure: headers arrived, the reset came
    // while reading. A retry wrapping only fetch() would not catch it.
    const dyingBody = {
      ok: true,
      status: 200,
      text: async () => {
        throw reset();
      },
    } as unknown as Response;
    const fetchImpl = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(dyingBody)
      .mockResolvedValueOnce(ok("corpus"));
    const r = recorder();
    await expect(fetchTextWithRetry("https://x/data", { fetchImpl, ...r })).resolves.toBe("corpus");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("honours attempts and baseDelayMs", async () => {
    const fetchImpl = vi.fn(async () => {
      throw reset();
    });
    const r = recorder();
    await expect(
      fetchTextWithRetry("https://x/data", { fetchImpl, ...r, attempts: 2, baseDelayMs: 50 }),
    ).rejects.toThrow(/after 2 attempts/);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(r.delays).toEqual([50]);
  });

  it("reports each retry, so a slow build says why it is slow", async () => {
    const onRetry = vi.fn();
    const fetchImpl = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(reset())
      .mockResolvedValueOnce(ok("corpus"));
    await fetchTextWithRetry("https://x/data", { fetchImpl, sleep: async () => {}, onRetry });
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0][0]).toMatchObject({ attempt: 1, attempts: 4, delayMs: 1000 });
    expect(onRetry.mock.calls[0][0].reason).toMatch(/ECONNRESET/);
  });
});

describe("fetchBufferWithRetry", () => {
  it("returns bytes, and retries them too -- the lexicon zips go through this", async () => {
    const fetchImpl = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(reset())
      .mockResolvedValueOnce(new Response(new Uint8Array([80, 75, 3, 4])));
    const r = recorder();
    const buf = await fetchBufferWithRetry("https://x/lexicon.zip", { fetchImpl, ...r });
    expect([...buf]).toEqual([80, 75, 3, 4]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
