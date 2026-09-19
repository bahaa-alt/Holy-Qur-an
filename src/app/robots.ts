import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Required under `output: "export"`: Next treats sitemap/robots as route
// handlers, which default to dynamic, and refuses to export one that has not
// declared itself static. Nothing here reads a request -- it is generated
// wholesale from the corpus at build time.
export const dynamic = "force-static";

/**
 * Points crawlers at the sitemap, and keeps them off the one route that has
 * nothing to index.
 *
 * `/saved/` renders a reader's own bookmarks out of their browser storage,
 * so a crawler fetching it sees an empty shell. Excluding it keeps that
 * shell out of results where it would look like a broken page.
 *
 * The two 404 shells are excluded for a different reason: they are client
 * components, so they cannot export metadata and cannot carry a canonical
 * of their own -- they inherit the layout's, which names the home page.
 * Keeping crawlers off them is the fix available from here.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/saved/", "/404/", "/_not-found/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
