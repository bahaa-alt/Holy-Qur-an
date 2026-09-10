/**
 * Standalone downloader for classical tafsir (Qur'anic commentary) texts.
 *
 * This is deliberately NOT part of the app's own data pipeline
 * (scripts/build-data.ts) and is never run by `prebuild`/`pnpm build` --
 * these texts are reference material for future research features, not
 * something the shipped app reads today. Downloaded files land under
 * references/tafsir/<slug>/<n>.json (one file per surah, in the source's
 * own shape), outside public/data entirely.
 *
 * Usage:
 *   pnpm tsx scripts/fetch-tafsir.ts --list
 *   pnpm tsx scripts/fetch-tafsir.ts <slug> [<slug> ...]
 *   pnpm tsx scripts/fetch-tafsir.ts --all-available
 *
 * Only `ar-tafsir-al-jalalayn` (~6 MB total) is committed to the repo --
 * see references/tafsir/.gitignore. The others are large (tens to hundreds
 * of MB; see the sizes below, measured from a real surah 2 download) and
 * stay git-ignored: fetch them locally whenever you actually need them.
 * Re-running is safe and resumable -- an already-downloaded surah file is
 * skipped, not re-fetched.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Source: https://github.com/spa5k/tafsir_api (MIT-licensed packaging;
// mirrors https://qul.tarteel.ai's tafsir resources), served from
// raw.githubusercontent.com -- see references/tafsir/README.md for the
// full provenance/licensing notes and which of the user's originally
// requested 9 works this could and couldn't reach.
const SOURCE_BASE = "https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir";
const SURAH_COUNT = 114;

interface TafsirCandidate {
  slug: string;
  titleAr: string;
  titleEn: string;
  /** Measured from a real surah 2 (286-verse) download, extrapolated to all 6,236 verses. */
  estimatedTotalMB: number;
}

const CANDIDATES: TafsirCandidate[] = [
  {
    slug: "ar-tafsir-al-jalalayn",
    titleAr: "تفسير الجلالين",
    titleEn: "Tafsir al-Jalalayn (already committed to this repo)",
    estimatedTotalMB: 6,
  },
  {
    slug: "al-kashshaf-al-zamakhshari",
    titleAr: "الكشاف عن حقائق غوامض التنزيل",
    titleEn: "Al-Kashshaf (al-Zamakhshari)",
    estimatedTotalMB: 56,
  },
  {
    slug: "tafsir-al-alusi",
    titleAr: "روح المعاني في تفسير القرآن العظيم والسبع المثاني",
    titleEn: "Ruh al-Ma'ani (al-Alusi)",
    estimatedTotalMB: 100,
  },
  {
    slug: "tafsir-al-razi",
    titleAr: "مفاتيح الغيب (التفسير الكبير)",
    titleEn: "Mafatih al-Ghayb / al-Tafsir al-Kabir (al-Razi)",
    estimatedTotalMB: 200,
  },
];

const OUT_DIR = join(process.cwd(), "references", "tafsir");

function printList() {
  console.log("Available tafsir slugs (fetch with: pnpm tsx scripts/fetch-tafsir.ts <slug>):\n");
  for (const c of CANDIDATES) {
    console.log(`  ${c.slug}`);
    console.log(`    ${c.titleAr} -- ${c.titleEn}`);
    console.log(`    ~${c.estimatedTotalMB} MB total\n`);
  }
  console.log("See references/tafsir/manifest.json for the full list of originally");
  console.log("requested works, including the ones no reachable source had.");
}

async function fetchSurah(slug: string, n: number): Promise<unknown> {
  const url = `${SOURCE_BASE}/${slug}/${n}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchTafsir(slug: string): Promise<void> {
  const candidate = CANDIDATES.find((c) => c.slug === slug);
  if (!candidate) {
    console.error(`Unknown slug "${slug}". Run with --list to see available tafsirs.`);
    process.exitCode = 1;
    return;
  }

  const dir = join(OUT_DIR, slug);
  mkdirSync(dir, { recursive: true });
  console.log(`Fetching ${candidate.titleEn} (~${candidate.estimatedTotalMB} MB, ${SURAH_COUNT} surahs)...`);

  let fetched = 0;
  let skipped = 0;
  for (let n = 1; n <= SURAH_COUNT; n++) {
    const dest = join(dir, `${n}.json`);
    if (existsSync(dest)) {
      skipped++;
      continue;
    }
    const data = await fetchSurah(slug, n);
    writeFileSync(dest, JSON.stringify(data), "utf8");
    fetched++;
    process.stdout.write(`\r  ${n}/${SURAH_COUNT} (${fetched} fetched, ${skipped} already cached)`);
  }
  console.log(`\n✓ ${slug} complete: ${fetched} fetched, ${skipped} already present in ${dir}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printList();
    return;
  }
  if (args.includes("--list")) {
    printList();
    return;
  }

  const slugs = args.includes("--all-available") ? CANDIDATES.map((c) => c.slug) : args;
  for (const slug of slugs) {
    await fetchTafsir(slug);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
