/**
 * The project's Zenodo DOIs.
 *
 * A URL says where something is; a DOI says what it is, and keeps saying so
 * after the URL moves. That matters more here than for most software,
 * because this tool now cites printed critical editions by name — a page
 * that attributes an article to Hārūn's 1399/1979 Dār al-Fikr edition
 * should itself be citable on the same terms.
 *
 * Zenodo mints TWO identifiers per archived project and they are not
 * interchangeable:
 *
 *   CONCEPT   resolves to whichever version is newest. Cite this when
 *             referring to the tool in general.
 *   VERSION   resolves to one frozen snapshot, forever. Cite this when a
 *             result has to be reproducible — which, for a research claim,
 *             is nearly always.
 *
 * The app shows the concept DOI (it is the stable name of the project) and
 * the generated citations carry the version DOI (a count is only checkable
 * against the build it came from). That split is the whole point of having
 * both.
 */

/** Always resolves to the newest archived version. */
export const CONCEPT_DOI = "10.5281/zenodo.22855797";

/** The v1.0.0 snapshot: commit ff1568bc2f, archived 20 September 2026. */
export const VERSION_DOI = "10.5281/zenodo.22855798";

/** The release the VERSION_DOI names, for display beside it. */
export const VERSION_TAG = "v1.0.0";

export const doiUrl = (doi: string) => `https://doi.org/${doi}`;
