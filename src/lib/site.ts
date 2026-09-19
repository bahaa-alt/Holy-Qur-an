/**
 * The one address this site calls its own.
 *
 * Every citation this app generates ends with a URL, and a citation is only
 * as durable as the address in it. Declaring a single canonical origin is
 * what makes `/root/رحم/` a stable reference rather than "wherever you
 * happened to be when you clicked Cite" -- which is what `window.location`
 * gave, and which differs between the deployed site, a preview and a local
 * `next dev`.
 *
 * The chosen origin is the GitHub Pages project site, base path included.
 * That address is made of the account name and the repository name, so
 * renaming or transferring the repository would break every citation
 * already in circulation; there is no redirect to soften it. That is a
 * known and accepted cost of not putting a domain in front of it, recorded
 * here so the next person weighing a rename can see what it costs.
 *
 * Overridable for a fork or a self-hosted copy. A mirror should keep
 * pointing at the canonical origin -- that is what a canonical URL is for --
 * so override this only when the fork means to BE the authority for its own
 * copy, not merely to serve one.
 */
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://bahaa-alt.github.io/Holy-Qur-an"
).replace(/\/+$/, "");

/**
 * Joins a site-relative path onto SITE_ORIGIN.
 *
 * Deliberately string concatenation rather than `new URL(path, base)`. The
 * URL constructor treats a leading `/` as "from the host root" and would
 * silently drop the `/Holy-Qur-an` base path -- producing canonical tags and
 * sitemap entries that 404, on every page, with nothing failing loudly. The
 * same trap is why `metadataBase` is not used to resolve these.
 *
 * `path` must already be percent-encoded, matching how the app builds hrefs
 * everywhere else (`/root/${encodeURIComponent(root)}/`): these addresses
 * carry Arabic, and the canonical URL has to be the one the server actually
 * serves.
 */
export function absoluteUrl(path: string): string {
  if (!path || path === "/") return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}/${path.replace(/^\/+/, "")}`;
}
