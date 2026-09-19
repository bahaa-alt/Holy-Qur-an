import type { MetadataRoute } from "next";
import { ALL_TOPICS } from "@/lib/topics/topicDefinitions";
import { readFormulas, readIndex, readManifest, readMeta } from "@/lib/data/serverData";
import { absoluteUrl } from "@/lib/site";

// Required under `output: "export"`: Next treats sitemap/robots as route
// handlers, which default to dynamic, and refuses to export one that has not
// declared itself static. Nothing here reads a request -- it is generated
// wholesale from the corpus at build time.
export const dynamic = "force-static";

/**
 * Every addressable page, as absolute canonical URLs.
 *
 * Built from the same sources as each route's `generateStaticParams`, so a
 * route that gains or loses pages moves this file with it rather than
 * drifting: surahs and verses from `meta`, roots and words from `index`,
 * topics from the topic table, formulas from `formulas`.
 *
 * Note the URLs are built with `absoluteUrl`, not resolved against
 * `metadataBase`. Next resolves a `metadataBase` with a path component using
 * the URL constructor, which drops `/Holy-Qur-an` from any path starting
 * with `/` -- see src/lib/site.ts.
 *
 * `lastModified` is the corpus build time for every entry, which is honest:
 * these pages are generated wholesale from one dataset, so they genuinely do
 * all change together. Per-page dates would be invented.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const meta = readMeta();
  const index = readIndex();
  const formulas = readFormulas();
  const lastModified = new Date(readManifest().builtAt);

  const paths: string[] = [
    "/",
    "/about/",
    "/quran/",
    "/roots/",
    "/search/",
    "/search/advanced/",
    "/query/",
    "/compare/",
    "/insights/",
    "/curiosities/",
    "/syntax/",
    "/names/",
    "/phrases/",
    "/topics/",
    "/topics/compare/",
    // `/saved/` is deliberately absent: it renders one reader's own
    // bookmarks out of their browser storage, so it has no content a
    // crawler could index and nothing stable to point anyone at.
  ];

  for (const s of meta.surahs) {
    paths.push(`/surah/${s.n}/`);
    for (let a = 1; a <= s.ayahs; a++) paths.push(`/v/${s.n}:${a}/`);
  }
  for (const r of index.roots) paths.push(`/root/${encodeURIComponent(r.ar)}/`);
  for (let i = 0; i < index.lemmas.length; i++) paths.push(`/word/${i}/`);
  for (const t of ALL_TOPICS) paths.push(`/topics/${t.slug}/`);
  for (const group of formulas.lengths) {
    for (const row of group.rows) {
      paths.push(`/insights/formulas/${group.length}/${encodeURIComponent(row.phraseKey)}/`);
    }
  }

  return paths.map((path) => ({ url: absoluteUrl(path), lastModified }));
}
