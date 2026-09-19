/**
 * Which files the static export writes but nothing ever requests.
 *
 * Next 16 emits three client segment-cache artifacts per page alongside
 * `index.html` and `index.txt`. Measured on this project's own 6,910-page
 * export:
 *
 *   __next._full.txt        97.9 MiB   byte-identical to index.txt on
 *                                      6,910 of 6,910 pages
 *   __next.<seg>.__PAGE__.txt  88.7 MiB
 *   __next._tree.txt          5.1 MiB
 *
 * Only `_full` is prunable, and the reason is not its redundancy -- it is
 * that no code can ask for it. The string "_full" appears nowhere in the
 * shipped client bundle (`out/_next/**`), nowhere in `next/dist/client/**`,
 * and nowhere in this app's own source or service worker. It is written by
 * `next/dist/server/app-render/collect-segment-data.js:205`
 * (`resultMap.set('/_full', fullPageDataBuffer)`) and read by nothing. A
 * file whose path no code constructs cannot be fetched, so deleting it
 * needs no browser verification.
 *
 * The other two are live and MUST stay: `next/dist/client/components/
 * segment-cache/cache.js:1192` fetches `/_tree`, and `__PAGE__` appears in
 * the shipped bundle. Deleting them would break soft navigation -- which is
 * why this list is one entry and not a `__next.*` glob, despite the glob
 * looking like a bigger win.
 *
 * Re-verify all three of those greps before adding anything here.
 */
export const PRUNABLE_BASENAMES: readonly string[] = ["__next._full.txt"];

/**
 * Whether a file is safe to delete from the export.
 *
 * Deliberately an exact basename match rather than a pattern: this decides
 * what gets deleted from a build output, and a pattern that drifted (say,
 * `__next.*`) would silently take the two live segment-cache files with it.
 */
export function isPrunable(basename: string): boolean {
  return PRUNABLE_BASENAMES.includes(basename);
}
