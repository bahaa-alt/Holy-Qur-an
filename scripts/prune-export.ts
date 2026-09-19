/**
 * Postbuild step: deletes the static export's write-only files.
 *
 * Runs after scripts/build-sw.ts, though the order does not actually
 * matter -- the service worker precaches a small fixed URL list rather
 * than a generated file manifest, so nothing it writes can go stale when
 * files are removed afterwards.
 *
 * See scripts/lib/prune-export.ts for what is removed and, more
 * importantly, why the other two segment-cache files are not.
 */
import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { isPrunable } from "./lib/prune-export";

const OUT_DIR = join(process.cwd(), "out");

function prune(dir: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = prune(path);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile() && isPrunable(entry.name)) {
      bytes += statSync(path).size;
      rmSync(path);
      files += 1;
    }
  }

  return { files, bytes };
}

function main() {
  try {
    statSync(OUT_DIR);
  } catch {
    console.warn("prune-export: out/ not found, nothing to prune.");
    return;
  }

  const { files, bytes } = prune(OUT_DIR);
  console.log(
    `Pruned ${files.toLocaleString()} write-only file(s) from out/ (${(bytes / 1024 / 1024).toFixed(1)} MiB)`,
  );
}

main();
