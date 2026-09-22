import type { TafsirMetaFile, TafsirSurahFile } from "@/lib/data/types";

/**
 * Three classical tafsirs shown alongside al-Jalalayn (the one this app
 * ships and validates at build time -- see scripts/lib/build-tafsir.ts),
 * but never bundled into the static export or precached for offline use:
 * al-Kashshaf alone is ~56 MB raw across all 114 surahs, and al-Razi is
 * ~200 MB -- adding that to the shipped site would blow well past the
 * size ceiling documented in RESEARCH-PLATFORM.md (the app was already
 * projected to breach GitHub Pages' 1 GB hard limit before this).
 *
 * Instead, a surah is fetched live, on demand, straight from the same
 * spa5k/tafsir_api CDN this project already vets and cites for
 * al-Jalalayn's own source (references/tafsir/manifest.json) -- MIT-licensed
 * packaging of classical, centuries-old public-domain scholarship, served
 * from raw.githubusercontent.com with `Access-Control-Allow-Origin: *`
 * (verified), so no proxy or re-hosting is needed. The service worker
 * only intercepts same-origin requests (see scripts/build-sw.ts), so this
 * fetch is never cached for offline use -- these three sources need a live
 * connection, unlike everything else in the app.
 *
 * Precise coverage counts (how many of 6,236 verses each work separately
 * comments on) are not tracked here: getting them would mean downloading
 * the full ~356 MB across all three sources, which is not worth paying on
 * every CI build just for a number the per-verse fetch already answers
 * honestly on its own (see mapExternalTafsirRows below).
 */
export interface ExternalTafsirSource {
  slug: string;
  name: string;
  nameAr: string;
  authors: string;
  authorsAr: string;
}

export const EXTERNAL_TAFSIR_SOURCES: readonly ExternalTafsirSource[] = [
  {
    slug: "al-kashshaf-al-zamakhshari",
    name: "Al-Kashshaf",
    nameAr: "الكشاف عن حقائق غوامض التنزيل",
    authors: "Abu al-Qasim al-Zamakhshari (d. 538/1144)",
    authorsAr: "أبو القاسم الزمخشري",
  },
  {
    slug: "tafsir-al-razi",
    name: "Mafatih al-Ghayb (al-Tafsir al-Kabir)",
    nameAr: "مفاتيح الغيب (التفسير الكبير)",
    authors: "Fakhr al-Din al-Razi (d. 606/1210)",
    authorsAr: "فخر الدين الرازي",
  },
  {
    slug: "tafsir-al-alusi",
    name: "Ruh al-Ma'ani",
    nameAr: "روح المعاني في تفسير القرآن العظيم والسبع المثاني",
    authors: "Mahmud al-Alusi (d. 1270/1854)",
    authorsAr: "محمود الآلوسي",
  },
];

const EXTERNAL_SLUGS = new Set(EXTERNAL_TAFSIR_SOURCES.map((s) => s.slug));

export function isExternalTafsirSlug(slug: string): boolean {
  return EXTERNAL_SLUGS.has(slug);
}

export function externalTafsirMeta(slug: string): TafsirMetaFile {
  const source = EXTERNAL_TAFSIR_SOURCES.find((s) => s.slug === slug);
  if (!source) throw new Error(`Unknown external tafsir slug: ${slug}`);
  return { slug: source.slug, name: source.name, nameAr: source.nameAr, authors: source.authors, authorsAr: source.authorsAr };
}

function externalTafsirUrl(slug: string, n: number): string {
  return `https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir/${slug}/${n}.json`;
}

/** One verse's commentary as spa5k/tafsir_api serves it -- see fetch-tafsir.ts. */
interface RawExternalTafsirRow {
  surah: number;
  ayah: number;
  text: string;
}

// Separate from loader.ts's own request cache -- this module fetches a
// different origin entirely (raw.githubusercontent.com, not this app's own
// DATA_BASE), so it keeps its own small in-memory cache with the same
// in-flight-dedup shape rather than reaching into loader.ts's private one.
const cache = new Map<string, Promise<TafsirSurahFile>>();

/**
 * One surah's commentary from an external tafsir source, fetched live and
 * never cached to disk or by the service worker (see this file's module
 * comment). Throws on a network failure or non-2xx response, same as
 * loader.ts's cachedFetch -- callers are expected to catch it.
 */
export function getExternalTafsirSurah(slug: string, n: number): Promise<TafsirSurahFile> {
  const key = `${slug}/${n}`;
  const existing = cache.get(key);
  if (existing) return existing;

  const promise = fetch(externalTafsirUrl(slug, n)).then(async (res) => {
    if (!res.ok) throw new Error(`Failed to fetch ${key}: ${res.status} ${res.statusText}`);
    const rows = (await res.json()) as RawExternalTafsirRow[];
    return mapExternalTafsirRows(slug, n, rows);
  });

  promise.catch(() => cache.delete(key));
  cache.set(key, promise);
  return promise;
}

/**
 * Reshapes a live-fetched surah into this app's own TafsirSurahFile shape,
 * matching buildTafsir's rules (empty text dropped, sorted by ayah) but
 * lenient rather than build-time-strict: a row for the wrong surah is
 * skipped rather than thrown, since a live fetch degrading gracefully
 * matters more here than it does for a build that can simply fail and be
 * re-run. A stray row for an ayah number this corpus doesn't have is
 * harmless even if not filtered here -- the panel only ever looks up the
 * one `a` it is currently showing, so an invalid entry is never displayed.
 */
export function mapExternalTafsirRows(
  slug: string,
  n: number,
  rows: readonly RawExternalTafsirRow[],
): TafsirSurahFile {
  const entries = rows
    .filter((row) => row.surah === n && row.text.trim() !== "")
    .map((row) => ({ a: row.ayah, t: row.text.trim() }))
    .sort((x, y) => x.a - y.a);
  return { slug, n, entries };
}
