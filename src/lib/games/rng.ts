/**
 * A tiny seeded PRNG (mulberry32) so every game round is a pure function of
 * its inputs -- no round builder ever calls Math.random() itself, which
 * makes them deterministic and unit-testable. Callers that want a real,
 * non-reproducible round (i.e. every actual game session) simply seed with
 * something like Date.now().
 */
export interface RandomDraw {
  value: number;
  nextSeed: number;
}

export function nextRandom(seed: number): RandomDraw {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, nextSeed: t };
}

/** An integer in [0, max), consuming one draw; returns the next seed alongside it. */
export function nextInt(seed: number, max: number): { value: number; nextSeed: number } {
  const { value, nextSeed } = nextRandom(seed);
  return { value: Math.floor(value * max), nextSeed };
}

/** Picks `count` distinct indices from [0, length), preserving draw order. */
export function pickDistinctIndices(length: number, count: number, seed: number): { indices: number[]; nextSeed: number } {
  const pool = Array.from({ length }, (_, i) => i);
  const indices: number[] = [];
  let s = seed;
  const n = Math.min(count, length);
  for (let i = 0; i < n; i++) {
    const { value, nextSeed } = nextInt(s, pool.length);
    s = nextSeed;
    indices.push(pool[value]);
    pool.splice(value, 1);
  }
  return { indices, nextSeed: s };
}

/** Fisher-Yates shuffle driven by the seeded PRNG, returning a new array. */
export function shuffle<T>(items: readonly T[], seed: number): { items: T[]; nextSeed: number } {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    const { value, nextSeed } = nextInt(s, i + 1);
    s = nextSeed;
    [arr[i], arr[value]] = [arr[value], arr[i]];
  }
  return { items: arr, nextSeed: s };
}
