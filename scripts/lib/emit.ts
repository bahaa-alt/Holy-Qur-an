import { gzipSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export interface SizeEntry {
  label: string;
  rawBytes: number;
  gzBytes: number;
}

export class SizeReport {
  private entries: SizeEntry[] = [];

  record(label: string, rawBytes: number, gzBytes: number) {
    this.entries.push({ label, rawBytes, gzBytes });
  }

  totalRaw(): number {
    return this.entries.reduce((sum, e) => sum + e.rawBytes, 0);
  }

  totalGz(): number {
    return this.entries.reduce((sum, e) => sum + e.gzBytes, 0);
  }

  print() {
    const fmt = (n: number) => `${(n / 1024).toFixed(1)} KB`;
    const width = Math.max(...this.entries.map((e) => e.label.length), "TOTAL".length) + 2;
    console.log("\n--- public/data size report ---");
    for (const e of this.entries) {
      console.log(`${e.label.padEnd(width)} raw ${fmt(e.rawBytes).padStart(10)}  gz ${fmt(e.gzBytes).padStart(10)}`);
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
