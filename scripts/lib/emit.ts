import { gzipSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export interface SizeEntry {
  label: string;
  rawBytes: number;
  gzBytes: number;
  /**
   * Whether this entry counts toward the whole-output budgets. False for
   * output that ships but is deliberately not part of the core offline
   * payload -- currently the alternative readings, which a researcher opts
   * into per verse and which `prefetchAll` does not warm. Such entries are
   * still printed (they are real bytes on the host) and still get their own
   * per-file budget; they just do not consume the core total's headroom.
   */
  counted: boolean;
}

export class SizeReport {
  private entries: SizeEntry[] = [];

  /**
   * The budget-counted entries, for checkSizeBudgets. Uncounted entries are
   * excluded here rather than filtered at each call site, so a new uncounted
   * row can never accidentally consume the core total's headroom.
   */
  all(): readonly SizeEntry[] {
    return this.entries.filter((e) => e.counted);
  }

  /** Every entry, counted or not -- for printing and per-file checks. */
  allIncludingUncounted(): readonly SizeEntry[] {
    return this.entries;
  }

  record(label: string, rawBytes: number, gzBytes: number, counted = true) {
    this.entries.push({ label, rawBytes, gzBytes, counted });
  }

  totalRaw(): number {
    return this.all().reduce((sum, e) => sum + e.rawBytes, 0);
  }

  totalGz(): number {
    return this.all().reduce((sum, e) => sum + e.gzBytes, 0);
  }

  print() {
    const fmt = (n: number) => `${(n / 1024).toFixed(1)} KB`;
    const width = Math.max(...this.entries.map((e) => e.label.length), "TOTAL".length) + 2;
    console.log("\n--- public/data size report ---");
    for (const e of this.entries) {
      const suffix = e.counted ? "" : "   (not counted toward the totals)";
      console.log(
        `${e.label.padEnd(width)} raw ${fmt(e.rawBytes).padStart(10)}  gz ${fmt(e.gzBytes).padStart(10)}${suffix}`,
      );
    }
    console.log(
      `${"TOTAL".padEnd(width)} raw ${fmt(this.totalRaw()).padStart(10)}  gz ${fmt(this.totalGz()).padStart(10)}`,
    );
  }
}

/** Writes minified JSON to `path`, creating parent directories as needed. Returns raw/gz byte sizes. */
export function writeJSON(path: string, data: unknown): { rawBytes: number; gzBytes: number } {
  mkdirSync(dirname(path), { recursive: true });
  const json = JSON.stringify(data);
  writeFileSync(path, json, "utf8");
  const gz = gzipSync(Buffer.from(json, "utf8"));
  return { rawBytes: Buffer.byteLength(json, "utf8"), gzBytes: gz.length };
}

/** Writes plain text (e.g. CSV) to `path`, creating parent directories as needed. Returns raw/gz byte sizes. */
export function writeText(path: string, text: string): { rawBytes: number; gzBytes: number } {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
  const gz = gzipSync(Buffer.from(text, "utf8"));
  return { rawBytes: Buffer.byteLength(text, "utf8"), gzBytes: gz.length };
}

/** Aggregates the raw/gz byte totals for a group of already-written files under one report label. */
export function recordGroup(
  report: SizeReport,
  label: string,
  sizes: { rawBytes: number; gzBytes: number }[],
) {
  report.record(
    label,
    sizes.reduce((s, x) => s + x.rawBytes, 0),
    sizes.reduce((s, x) => s + x.gzBytes, 0),
  );
}

export interface BudgetViolation {
  /** the offending file's report label, or "TOTAL" for a whole-output budget */
  label: string;
  actual: number;
  budget: number;
  kind: "raw" | "gz";
}

/**
 * Compares a size report's entries against the per-file and whole-output
 * budgets, returning every violation rather than stopping at the first.
 *
 * Extracted so `--check` mode and the real write path enforce budgets
 * through exactly one implementation. They previously did not: `--check`
 * built its own report with `gzBytes` hardcoded to 0, left `surahs/*.json`
 * out, counted `export/corpus.csv` (which the real build excludes), and
 * then never compared anything to a budget at all -- so the mode whose
 * documented job is to "validate the pipeline without writing files" could
 * not fail on size, and a budget regression only surfaced in CI's later
 * `Build` step.
 *
 * `entries` must contain only budget-counted output: pass the same set the
 * real build totals, i.e. excluding `export/corpus.csv`.
 */
export function checkSizeBudgets(opts: {
  entries: readonly SizeEntry[];
  perFileRawBudgets: Readonly<Record<string, number>>;
  totalRawBudget: number;
  totalGzBudget: number;
}): BudgetViolation[] {
  const violations: BudgetViolation[] = [];

  for (const e of opts.entries) {
    const budget = opts.perFileRawBudgets[e.label];
    if (budget !== undefined && e.rawBytes > budget) {
      violations.push({ label: e.label, actual: e.rawBytes, budget, kind: "raw" });
    }
  }

  const totalRaw = opts.entries.reduce((sum, e) => sum + e.rawBytes, 0);
  if (totalRaw > opts.totalRawBudget) {
    violations.push({ label: "TOTAL", actual: totalRaw, budget: opts.totalRawBudget, kind: "raw" });
  }

  const totalGz = opts.entries.reduce((sum, e) => sum + e.gzBytes, 0);
  if (totalGz > opts.totalGzBudget) {
    violations.push({ label: "TOTAL", actual: totalGz, budget: opts.totalGzBudget, kind: "gz" });
  }

  return violations;
}

/** Formats a budget violation as a one-line, actionable build error. */
export function formatBudgetViolation(v: BudgetViolation): string {
  const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
  const what = v.label === "TOTAL" ? `Total public/data/v1 ${v.kind} size` : `${v.label} (${v.kind})`;
  return `${what} exceeds its budget: ${kb(v.actual)} > ${kb(v.budget)}`;
}
