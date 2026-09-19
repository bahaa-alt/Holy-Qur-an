import { readMeta } from "@/lib/data/serverData";
import { CuriositiesPageContent } from "@/components/curiosities/CuriositiesPageContent";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Curiosities",
  alternates: { canonical: absoluteUrl("/curiosities/") },
};

/**
 * Material that is interesting but is not linguistic evidence.
 *
 * Abjad (gematria) numerology used to sit as a tab on /insights/, beside
 * morphology, distinctive vocabulary and collocation statistics. The code is
 * sound and well tested; its placement was the problem. Presenting letter-sum
 * numerology as one method among the corpus-linguistic ones tells a visiting
 * researcher something about this tool's epistemics, and not the thing the
 * rest of it has earned.
 *
 * So it moves here rather than being deleted: a separate page that says what
 * this material is and is not, off the main navigation, reachable from
 * /insights/ for anyone who wants it.
 */
export default function CuriositiesPage() {
  return <CuriositiesPageContent meta={readMeta()} />;
}
